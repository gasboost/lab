# ワークフローアプリの作業規約

## 適用範囲と参照先

このファイルは `apps/workflow/` 全体の開発に適用する。
業務仕様・機能要件は対応するGitHub Issueを参照する。
Issueには「何を実現するか」、AGENTS.mdには「どう実装・検証するか」を記載する。

- Backendの実装・検証では [backend/AGENTS.md](backend/AGENTS.md) を読む。
- Frontendの実装・検証では [frontend/AGENTS.md](frontend/AGENTS.md) を読む。
- `tests/` は `src/backend/`・`src/frontend/` の子孫ではない。テストを追加・変更する場合も、対象領域のAGENTS.mdを必ず読む。両領域に関係する場合は両方読む。現段階では `tests/AGENTS.md` を追加しない。

## 構成と配置

TypeScript / React / Vite / Tailwind CSS v4 / shadcn/ui、
GAS / `@gasboost/app`、
Google Sheets / `@gasboost/sheetorm` を使用する。

| 配置            | 責務                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------- |
| `src/`          | アプリケーションの実装コード                                                                 |
| `src/backend/`  | GAS上で動作するBackend。Domain / Application / Infrastructure / Presentationの責務を分離する |
| `src/frontend/` | ReactのFrontend。業務機能はfeature単位で整理する                                             |
| `src/shared/`   | FrontendとBackendの両方で実際に使用する純粋な定義のみ                                        |
| `tests/`        | テストコード。対象機能・領域が分かるように配置する                                           |
| `tests/mocks/`  | GASランタイム・SheetORM等のIn-Memory Fakeと共通テスト環境                                    |

Backend専用のRLSやGAS処理、Reactコンポーネントをsharedへ置かない。
将来共有しそうという理由で定義を移さない。
配置表はディレクトリや空ファイルの一括生成を求めるものではない。

## 共通原則

- 着手前にIssue、関連する既存コード、利用するgasboostの実際の公開APIを確認する。インストール済みパッケージの型定義・公開ドキュメント等で確認し、APIを推測しない。
- 既存ライブラリ、create生成済みのBootstrap / Auth / SheetDB / RPC基盤、UI Registryを再実装しない。
- 不必要なファイル・抽象化・共通化・薄いラッパー・先行契約・ダミーコードを作らない。必要な定義は、その機能を実装するIssueで追加する。技術レイヤーの先行整備だけを目的にしない。
- 対象機能の実装と対応するテストの追加・更新はセットで行う。テストは `tests/` に置き、対象領域のAGENTS.mdの要件を満たす。
- 未決定の業務仕様を勝手に確定しない。不明点は明示し、Issueに必要な情報を創作しない。
- 既存のAGENTS.md、生成済みコードを勝手に削除・再生成しない。変更が必要ならIssueの対象に明記する。担当Issueに無関係なリファクタリングをしない。
- 別のアプリケーションへの依存や、不要な共有パッケージを作らない。
- 機密設定・認証情報をコミットしない。既存のCI/CD以外の方法による実GASへのデプロイや本番データ変更は、明示的な指示がある場合に行う。

## 検証と作業の完了

Node.js 24以上、pnpm 10.18.0を使用する。

依存関係のインストールはリポジトリルートで実行する。

    pnpm install --frozen-lockfile

ローカル開発サーバーはリポジトリルートから起動する。

    pnpm --filter workflow dev

フォーマット・静的解析・型チェック・テスト・ビルドは
リポジトリルートで実行する。

    pnpm check:fix
    pnpm check
    pnpm typecheck
    pnpm test
    pnpm build

- フォーマットおよび静的解析にはBiomeを使用する。
- 静的解析の指摘は原則としてコードを修正して解消する。
- 静的解析やテストを通すことだけを目的として、ルールの無効化、検証対象からの除外、テストの削除・スキップを行わない。
- 技術的に避けられない例外がある場合は、理由を明示し、必要最小限の範囲に限定する。
- 検証に失敗した場合は修正して再検証する。
- 文書のみの変更は書式、リンク、内容の整合性を検証する。
- 実行結果と未検証の範囲を報告する。

Gitの変更は担当Issue単位とし、Conventional Commits形式を使用する。
PR作成前に変更内容と検証結果を確認する。
