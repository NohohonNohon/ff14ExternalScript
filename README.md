## FF14外部画像参照補助スクリプト

FF14のロードストーンで外部画像参照機能を簡単に行うためのGreasemonkeyスクリプトです。

## 説明

FF14のロードストーンで外部画像参照機能を使うときに、  
外部サービス（Picasa）でアップロードした画像のURL取得、登録する手間を省くことができます。

***デモ:***

![DEMO](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/demo.gif)

## 対応ブラウザ

- Firefox  
※[Greasemonkey](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/ "Greasemonkey :: Add-ons for Firefox")のインストールが必要です。
- Chrome  
※[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo "Tampermonkey - Chrome Web Store")のインストールが必要です。

## インストール

1. 下記リンクをクリックしてください。  
  [FF14外部画像参照補助スクリプト](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/FF14外部画像参照補助スクリプト.user.js "FF14外部画像参照補助スクリプト")

2. インストール確認画面で[インストール]をクリックしてください。  
![Firefox](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/firefox_inst.jpg)
![Chrome](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/chrome_inst.jpg)

## 使用方法

1. 外部サービス（Picasa）にログインします。  
※ログインした状態でないと正常に動作しません。  

2. 画像をアップロードするアルバムを開きます。  
※アルバムの公開設定は「ウェブ上で一般公開」に設定してください。  
![album_public1](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/album_public1.jpg)  
![album_public2](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/album_public2.jpg)  

2. [写真を追加]をクリックします。  
![photo_add](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/photo_add.jpg)  

3. アップロード画面のURLをコピーします。  
![url_copy](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/url_copy.jpg)  

4. FF14ロードストーンの新規日記作成画面を開きます。
![new_blog](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/new_blog.jpg)  

5. スクリプトのコンフィグ画面を開きます。  
![config_firefox](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/config_firefox.jpg)  
![config_chrome](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/config_chrome.jpg)  

6. アップロード画面URLにコピーしたURLを貼り付けます。

7. その他設定をしたら、[保存]ボタンをクリックします。  
![config](https://raw.github.com/NohohonNohon/ff14ExternalScript/master/data/config.jpg)  

8. デモの様に外部画像参照機能を使うことができます。

## 作者

Nohohon

## ライセンス

[MIT](http://b4b4r07.mit-license.org)
