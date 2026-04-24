# enon Official Website

5人組アイドルグループ **enon（エノン）** 公式サイト。

> On音楽を通じて、出会ったEn縁を大事にする。

## Members

| No. | Name | Color |
|-----|------|-------|
| 01 | 月詠 ほのか (Tsukiyomi Honoka) | White |
| 02 | 星江 森 (Hoshie Mori) | Green |
| 03 | 空乃 ふわり (Sorano Fuwari) | Sky Blue |
| 04 | 一ノ瀬 ゆな (Ichinose Yuna) | Pink |
| 05 | 千葉 凜 (Chiba Rin) | Yellow |

## Debut

**2026.04.29** — 渋谷 Garret にてデビューライブ「enon 1st contact」開催。

## Structure

```
.
├── index.html        # Top page
├── members.html      # Member profiles
├── news.html         # News / announcements
├── schedule.html     # Live & events schedule
├── css/style.css
├── js/site.js        # dynamic renderer (reads data/content.json)
├── data/
│   └── content.json  # editable content (edited via admin)
├── admin/
│   ├── index.html    # management UI
│   ├── admin.css
│   └── admin.js
└── images/
    ├── logo.png
    └── logo.svg
```

## Admin (コンテンツ管理画面)

`/admin/` を開くと、Members / News / Schedule / Gallery / SNS / グループ設定を編集できます。

**編集フロー:**
1. 公開URL + `/admin/` を開く（例: `https://enon-idol.com/admin/`）
2. 各タブで編集（入力内容は自動的にブラウザ内に保存）
3. **プレビュー** ボタンで編集中の内容を別タブで確認
4. **content.json をダウンロード** で編集済みJSONを保存
5. ダウンロードしたファイルを `data/content.json` に上書き
6. GitHub Desktop または `git push` でサイトに反映

## Local preview

ローカルでプレビューするには簡易HTTPサーバーを起動してください（`file://` ではfetchが動きません）:

```bash
cd ~/Documents/"Claude Code"/enon_web
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

GitHub Pages で公開（カスタムドメイン `enon-idol.com`）。`main` ブランチへのpushで自動反映されます。
公開URL: <https://enon-idol.com>
