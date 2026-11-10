#!/usr/bin/env python3
"""Real Chrome gates against a copied npm install and native Quarto OJS output.

Setup only: uv run --no-project --with playwright --with pillow python this-file.
After browser/dependency setup all consumer requests are local; external requests fail.
"""

import argparse
import base64
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading
from importlib.metadata import version

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--installed",
        type=Path,
        default=Path(".build/packages/javascript-installed.json"),
    )
    parser.add_argument(
        "--output", type=Path, default=Path(".build/packages/javascript-gallery")
    )
    parser.add_argument(
        "--browser-executable",
        default="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    )
    args = parser.parse_args()
    installed = json.loads(args.installed.read_text())
    root = Path(installed["consumer"])
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), functools.partial(Quiet, directory=str(root))
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    evidence = {
        "artifactSha256": installed["sha256"],
        "quartoVersion": installed["quartoVersion"],
        "playwrightVersion": version("playwright"),
        "pillowVersion": version("Pillow"),
        "cases": [],
        "externalRequests": [],
    }
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=args.browser_executable,
            headless=True,
        )
        evidence["chromeVersion"] = browser.version
        page = browser.new_page(viewport={"width": 1400, "height": 1000})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        def route(r):
            if r.request.url.startswith(origin + "/"):
                r.continue_()
            else:
                evidence["externalRequests"].append(r.request.url)
                r.abort()

        page.route("**/*", route)
        page.goto(origin + installed["browserPath"])
        page.wait_for_function("window.fixture")
        ids = page.evaluate("fixture.spec.cases.map(c=>c.id)")
        assert len(ids) == 72
        for case in ids:
            page.evaluate("(id)=>renderCase(id)", case)
            result = page.evaluate("""async()=>{
              const f=fixture,s=f.s;
              const data=['A','B','C','D','E'].map((category,i)=>({x:i,y:i+1,category}));
              const scatter=f.Plot.plot(f.options(s,{height:s.width*.4,marks:f.scatter(s,data,{domain:['A','B','C','D','E'],variant:'colorblind-subset-5'})}));document.querySelector('#plots').append(scatter);f.stylePlot(s,scatter);
              const legends=[...document.querySelectorAll('[data-pf-legend]')].map(n=>{
                const box=n.getBoundingClientRect(),texts=[...n.querySelectorAll('text')].map(t=>{const b=t.getBoundingClientRect();return {text:t.textContent,x:b.x-box.x,y:b.y-box.y,width:b.width,height:b.height}});
                const ticks=texts.slice(0,5);return {width:box.width,texts,nonoverlap:ticks.every((a,i)=>ticks.every((b,j)=>i===j||a.x+a.width<=b.x||b.x+b.width<=a.x))};
              });
              const font=[...f.chart.querySelectorAll('text')].map(t=>({family:getComputedStyle(t).fontFamily,size:getComputedStyle(t).fontSize,weight:getComputedStyle(t).fontWeight}));
              const headingNode=f.wrap.querySelector('h2'),heading={family:getComputedStyle(headingNode).fontFamily,size:getComputedStyle(headingNode).fontSize,weight:getComputedStyle(headingNode).fontWeight};
              const before=f.chart.outerHTML,files=[];
              for(const [name,node] of [['line',f.chart],['scatter',scatter],['continuous',f.continuous],['heatmap',f.cells]]){
                for(const format of ['svg','png']){const result=await (format==='svg'?f.exportSvg(s,node):f.exportPng(s,node));const bytes=new Uint8Array(await result.blob.arrayBuffer());let text='';for(const byte of bytes)text+=String.fromCharCode(byte);files.push({name,format,base64:btoa(text),report:result.report});}
              }
              const shared=[...f.chart.querySelectorAll('.pf-understroke path')].map((p,i)=>{const q=f.chart.querySelectorAll('.pf-foreground path')[i];return {samePath:p.getAttribute('d')===q.getAttribute('d'),under:getComputedStyle(p).strokeWidth,foreground:getComputedStyle(q).strokeWidth,underDash:getComputedStyle(p).strokeDasharray,foregroundDash:getComputedStyle(q).strokeDasharray}});
              const diagonal=[...f.cells.querySelectorAll('[class*=pf-missing-cross] path')].map(p=>p.getAttribute('d'));
              return {case:s.case.id,typography:s.case.typography,font,heading,legends,shared,missingDiagonals:diagonal,callerUnchanged:before===f.chart.outerHTML,files};
            }""")
            assert result["callerUnchanged"]
            assert len(result["shared"]) == 3
            assert len(result["font"]) >= 10
            assert len(result["legends"]) == 2
            assert all(
                x["samePath"] and x["underDash"] == x["foregroundDash"]
                for x in result["shared"]
            )
            assert all(
                l["nonoverlap"] and len(l["texts"]) == 6 for l in result["legends"]
            )
            source_case = page.evaluate("fixture.s.case")
            expected_font = page.evaluate(
                "fixture.s.spec.fonts[fixture.s.case.fonts.ui]"
            )
            assert all(
                source_case["fonts"]["ui"] in f["family"]
                and float(f["size"].replace("px", ""))
                == source_case["typography"]["label"]
                and int(f["weight"]) == expected_font["weight"]
                for f in result["font"]
            )
            expected_heading = page.evaluate(
                "fixture.s.spec.fonts[fixture.s.case.fonts.heading]"
            )
            assert source_case["fonts"]["heading"] in result["heading"]["family"]
            assert (
                float(result["heading"]["size"].replace("px", ""))
                == source_case["typography"]["heading"]
            )
            assert int(result["heading"]["weight"]) == expected_heading["weight"]
            assert all(
                float(v["under"].replace("px", "")) == 5.5
                and float(v["foreground"].replace("px", "")) == 2.5
                for v in result["shared"]
            )
            assert len(set(result["missingDiagonals"])) == 2
            for item in result["files"]:
                raw = base64.b64decode(item.pop("base64"))
                name = (
                    case.replace("/", "-") + "-" + item["name"] + "." + item["format"]
                )
                (out / name).write_bytes(raw)
                item.update(
                    path=name, sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw)
                )
            evidence["cases"].append(result)
        # Exercise actual native hover and exact file-backed text after late insertion.
        page.evaluate("renderCase('tufte/dark/reading/paper')")
        page.locator(
            ".pf-category-points circle,.pf-category-points path"
        ).first.hover()
        page.wait_for_function(
            "fixture.chart.querySelectorAll('[aria-label=\"tip\"] text').length>0"
        )
        evidence["hover"] = page.evaluate(
            """()=>[...fixture.chart.querySelectorAll('[aria-label="tip"] text')].map(t=>({text:t.textContent,family:getComputedStyle(t).fontFamily,size:getComputedStyle(t).fontSize}))"""
        )
        assert evidence["hover"]
        assert all(
            "59035112d7e2bc6a" in t["family"] and t["size"] == "16px"
            for t in evidence["hover"]
        )
        page.set_viewport_size({"width": 390, "height": 900})
        evidence["mobile"] = page.evaluate(
            """()=>({pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,chartWidth:fixture.chart.getBoundingClientRect().width,wrapper:document.querySelector('main').getBoundingClientRect().width})"""
        )
        assert evidence["mobile"]["pageWidth"] == 390
        page.screenshot(path=str(out / "mobile.png"), full_page=True)
        # Real Quarto's pinned OJS runtime, with all external requests still blocked.
        page.goto(origin + installed["ojsPath"])
        page.wait_for_selector(".pf-foreground path")
        assert "OJS Runtime Error" not in page.locator("body").inner_text()
        evidence["ojs"] = page.evaluate(
            """()=>({paths:document.querySelectorAll('.pf-foreground path').length,fonts:[...document.querySelectorAll('.pf-direct-label text')].map(t=>getComputedStyle(t).fontFamily)})"""
        )
        assert evidence["ojs"]["paths"] == 3
        evidence["tutorials"] = []
        for name in ["deliveries", "energy", "changes", "native"]:
            page.set_viewport_size({"width": 1000, "height": 900})
            page.goto(origin + "/" + name + ".html")
            page.wait_for_function("window.plotfoundryExample")
            if name == "deliveries":
                page.wait_for_selector('#downloads a[download="deliveries.png"]')
            details = page.evaluate(
                """()=>({case:plotfoundryExample.config.case.id,svg:document.querySelector('#chart svg').outerHTML,downloads:[...document.querySelectorAll('#downloads a')].map(a=>a.download),width:plotfoundryExample.chart.getBoundingClientRect().width})"""
            )
            assert details["width"] == 640
            if name == "deliveries":
                assert details["downloads"] == ["deliveries.svg", "deliveries.png"]
            page.evaluate('document.querySelector("#chart").style.width="640px"')
            page.locator("#chart").screenshot(path=str(out / (name + "-tutorial.png")))
            details["sourceSha256"] = hashlib.sha256(
                (root / (name + ".js")).read_bytes()
            ).hexdigest()
            details["name"] = name
            evidence["tutorials"].append(details)
        assert not errors, errors
        assert not evidence["externalRequests"], evidence["externalRequests"]
        evidence["errors"] = errors
        browser.close()
    server.shutdown()
    (out / "manifest.json").write_text(json.dumps(evidence, indent=2) + "\n")
    from PIL import Image, ImageOps, ImageDraw

    samples = [
        "folio-light-reading-paper",
        "tufte-dark-reading-paper",
        "litera-reading-light-presentation-panel",
        "darkly-reading-dark-presentation-paper",
    ]
    sheet = Image.new("RGB", (1000, 740), "white")
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(samples):
        image = Image.open(out / (name + "-line.png")).convert("RGB")
        image.thumbnail((480, 320))
        x = (i % 2) * 500
        y = (i // 2) * 370
        draw.text((x + 10, y + 5), name, fill="black")
        sheet.paste(image, (x + 10, y + 30))
    sheet.save(out / "contact-sheet.png")
    print(
        f"Packed offline browser/OJS matrix passed: {len(ids)}cases, {len(ids)*8}exports; {out}"
    )


if __name__ == "__main__":
    main()
