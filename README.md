# Economy & Finance Guide

A static, interactive guide that builds a broad foundation in economics and financial markets. The published page has English and Chinese text arranged side by side, with controls, examples, and source links.

## Build and preview

Requirements: Node.js 18 or later and Python 3.

```sh
node build.mjs
python3 prepare-bilingual.py
python3 build-bilingual.py
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/index-bilingual.html`. The renderer uses the vendored Marked parser under `vendor/marked/`; its separate MIT notice is retained there. No package install is required.

The guide links to public primary sources, including statistical agencies, central banks, regulators, and international institutions. It is educational material, not investment advice; figures and institutional pages can change over time.

## License and source material

The root MIT license covers code authored for this repository. Lesson text, translations, examples, and any material from linked sources are not included in that code license. Source links are retained; reuse must follow the terms and rights of the relevant original material.
