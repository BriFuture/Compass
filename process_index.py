# -*- coding: utf-8 -*-

import shutil as sh
from pathlib import Path

src = Path("./compassvue/dist").absolute().resolve()
dst = Path("html").absolute().resolve()
print(src, dst)
if dst.exists():
    sh.rmtree(dst)
sh.copytree(src, dst)

index = Path("./html/index.html")
print(index.exists())
with index.open("r+") as f:
    content = f.read()
    content = content.replace('/js', './js')
    content = content.replace('/css', './css')
    
    print(content)
    f.seek(0)
    f.write(content)