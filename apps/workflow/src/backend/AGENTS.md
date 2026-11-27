# Backendの実装・テスト規約

`src/backend/` に適用する。[アプリ全体の規約](../../AGENTS.md) と併せて読む。Backendに対応する `tests/` の作業時にも本規約を適用する。

## 4層の責務と依存方向

| 層・配置                           | 責務                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Domain / `domain/`                 | Entity / Value Object、業務ルール、不変条件、状態遷移などのドメインロジック                                   |
| Application / `application/`       | ユースケース、処理のシーケンス制御、アプリケーションロジック。Repository interfaceを配置する                  |
| Infrastructure / `infrastructure/` | ApplicationのRepository interfaceを実装し、SheetORM等による永続化・外部サービス接続とDomainの保存・復元を行う |
| Presentation / `presentation/`     | AppsScript RPC / Handler / Middleware、入力・出力の境界、認証・認可の適用                                     |

- Domainは他の3層に依存しない。ApplicationはDomainとApplication側のinterfaceを使用し、Infrastructureの具象に依存しない。InfrastructureはApplicationのinterfaceとDomainに依存し、PresentationはApplicationを呼び出す。具象の接続は既存DI基盤で行う。
- **1 UseCase（1操作）= 1クラス**とし、各クラスは単一の `execute` を持つ。複数APIを `Customers` 等の1クラスに集約しない。DI登録・Handlerからのresolve・Application結合テストもUseCase単位にする。1 Issueに複数APIを含むことと、1クラスに複数操作を含むことは別である。
- **Domainは永続化・通信形式を知らない。** `toRecord()` / `fromRecord()` 等の永続化都合のメソッド（単なる改名も含む）、SheetORM Record・保存用Schema・RPC DTOへの依存を禁止する。Domainが必要な機能では、DomainとRecordの変換はInfrastructureのRepositoryが担当する。Domainは業務上の属性・不変条件・状態変更に専念する。
- **ApplicationはDomainも永続化Recordも戻り値にしない。** 業務ロジックはDomainへ、永続化はRepositoryへ委譲し、APIが必要とする結果を返す。永続化RecordをそのままAPIの戻り値として流用しない。
- **ヘルパー関数とprivate methodは禁止。** 処理をそれらに押し込んで責務の混在を隠さず、適切なクラス・オブジェクト・層へ責務を分離する。
- 実際の機能に必要なものだけ実装する。目的なくレイヤーごとの空ファイルやinterfaceを一括生成しない。

## Repositoryの公開契約とAggregateの状態変更

- **Repositoryは原則 `find(parameter): DomainAggregate[]` と `save(aggregate): void` のみ公開する。** `list` / `create` / `update` / `delete` のようなユースケース操作別メソッドを増やさない。例外が明確に必要な場合は、その根拠を示す。
- `find` の検索条件なし・ID・キーワード・ページング等はパラメータで表し、Domain Aggregateの配列を返す。0件は空配列とし、SheetORM Record・DTOや総件数付き一覧レスポンスをそのまま返さない。総件数・ページ情報はUseCaseで組み立て、必要な取得量のトレードオフを説明する。
- `save` はAggregateを永続化し、戻り値を持たない。InfrastructureのRepositoryはQuery構築・RecordとAggregateの相互変換・保存のみを担当する。業務操作やレスポンス構築、既存Aggregateへの変更項目の合成を行わず、SheetORMのCRUDを薄く再公開しない。
- **Aggregateの状態を変更できるのはDomainのみ。** Applicationは取得・対象なしの判定・Domainの状態変更メソッド呼び出し・保存を調整する。変更しなかった属性の保持や更新日時の整合はDomainが担い、ApplicationやRepositoryに属性の合成を書かない。
- 入力形式の検証をDomainに置かないことと、Domainから状態変更の振る舞いを取り除くことを混同しない。Domain単体テストは状態変更・未指定属性の保持、UseCase結合テストは実Repositoryによる取得→Domainの変更→保存、Repository結合テストは保存・復元を検証する。
- UUID採番・Queryのページング・トランザクション・ロック等の利用方法とRepositoryの公開契約は区別する。`save(): void` の前後でAggregateのIDがいつ確定するかを明示する。Customerでは保存前に既存の `Utilities.getUuid()` でIDを確定し、SheetORMに同じIDを保存させるためDBの自動再採番は使わない。取得から保存までのトランザクションには既存SheetORMを利用する。

## Domainに書いてはいけないこと

- **外部入力の型・形式・必須・文字数・メール形式などの入力バリデーションをDomainへ置かない。** これはPresentationの責務とする。Frontendのフォーム検証だけで済ませず、サーバー側の入力境界でも検証する。
- **SheetORM RecordのZodスキーマ検証、UUID・日時の形式検証、Unique等の永続化制約をDomainに持ち込まない。** これらはInfrastructure / SheetORMの責務とする。DomainでZodを利用する場合も、業務上の不変条件を表現する場合に限定し、形式検証を目的として利用しない。
- Domainは業務ルール・不変条件・状態遷移に集中する。検証を置く理由は、入力形式の確認ではなく、完了済み問い合わせの通常編集や担当未設定での対応開始など、**業務上成立しない操作・状態を防ぐ場合のみ**とする。
- **業務ルールのないCRUDデータにDomain Entityや架空の業務検証を義務付けない。** 不要なDomainクラス・メソッド・テストを作らない。入力検証の配置とDomainモデルの採否は分けて判断する。Repositoryが業務上の実体を保存・復元する構成では、Domainモデルは業務属性を持ち、Repository interfaceはそのモデルを扱う。形式検証の撤去を理由にモデルを単なるRecordや代替DTOへ置き換えない。
- **SheetORMが持つ採番・制約・楽観的ロック等を必要以上に再実装しない。** 利用しているパッケージの公式ドキュメントと実APIを先に確認する。UUID採番・日時生成等の技術的な処理、Recordへの変換・検証は適切な境界で扱う。

## RPCの型と入力検証

- `src/backend/main.ts` のAppsScript RPC定義をAPI型の唯一の正本とする。既存の `AppType = InferAppsScript<typeof app>` とFrontendの `src/frontend/lib/appsscript.ts` の `appsScriptClient` を利用する。
- FrontendがBackendから参照するのは `import type` による推論済みの型情報のみ。Backendの実行コードをFrontendに取り込まない。
- API入出力型の共有だけを目的とする `contracts.ts`、`shared/schemas/contracts.ts`、重複するAPI contract / interface、独自の契約レイヤーは作成禁止。
- 入力値の実行時検証が必要なら、対象機能に必要なZodスキーマを使う。`InferAppsScript` の型推論は実行時バリデーションを代替しない。
- Issue Templateの入力・出力欄は振る舞いを伝える仕様記述であり、契約ファイルの作成要求ではない。

## DI・認証認可・RLS

- UseCaseやRepositoryをDIコンテナで生成する場合は、Awilixの **`asFunction`** でファクトリを登録する。ビルド時のminifyを考慮し、`asClass` は使用しない。
- 生成済みのインスタンスをそのままコンテナに登録する場合は **`asValue` を使用してよい**。依存は必要になった機能の実装時に追加する。既存登録の変更は担当Issueの範囲に従う。
- APIの操作権限は `@gasboost/app` で扱う **RPC固有の認可Middleware** で表現する。既存 `@gasboost/auth-app` の認可Middleware / 公開APIに整合させ、独自の認可基盤を作らない。
- レコード単位の認可が必要な機能では **`@gasboost/rls`** を使用する。RLS定義はBackendに置き、実際にSheetORMへ適用する。Frontend用sharedへ移さない。必要な導入・定義は対象機能のIssueで行う。
- Presentationの操作権限とDBのRLSは責務が異なる。片方で片方を代替しない。
- 認証主体はサーバーの認証済みContextから取得する。Frontendから送られたユーザーIDやロールを信用しない。
- 現行のBootstrap、Auth、SheetDB、RPC基盤を再構築しない。

## Backendテスト

テストは `tests/` に配置する。実装した機能について、該当する以下のテストを必須とする。

| 対象                        | 必須のテストと範囲                                                                                            | モック・Fakeの許容範囲                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Domain                      | 単体テスト。業務ルール・状態遷移・不変条件を検証する                                                          | Domain自体は実物                                           |
| Infrastructure / Repository | 結合テスト。実Repositoryでデータを正しく保存・復元・再読込できることを検証する                                | GAS等の外部実行環境にはIn-Memory Fakeを使う                |
| Application / UseCase       | 結合テスト。実UseCaseと実Repositoryを接続して処理結果を検証する                                               | 外部環境のIn-Memory Fakeは可。**Repositoryのモックは禁止** |
| Presentation / API          | **APIごとに結合テスト**。実際の認証・認可Middlewareを通り、Handlerから正しいUseCaseが呼ばれることまで検証する | **UseCaseのモックは可**。認証・認可Middlewareは実物        |

- **UseCaseごとの実Repository結合テスト、およびRepositoryの保存・復元・再読込テストを必須**とする。Domain単体テストは実在する業務上の不変条件・業務操作のみを対象とし、入力形式や永続化マッピングを検証しない。独自の検証ルールがなくても、Domainに状態変更の振る舞いがあれば未指定属性の保持などを単体テストする。不正入力はPresentation、Recordのスキーマ・保存・復元はRepositoryの結合テストで検証する。
- RLSは **専用のテストファイル** で検証する。権限のあるPrincipal・ないPrincipal、許可・拒否の代表ケースを含める。
- Fake化するのは外部環境・GAS組み込みサービス等の境界。Application結合テストでRepositoryをモックして通さない。
- `tests/mocks/` にGASランタイム・SheetORM用のIn-Memory Fakeと共通テスト環境を集約する。現行の `runtime.ts`・`db.ts` とVitestの `setupFiles` を確認して再利用し、各テストで勝手にFakeを量産しない。
- データ・セッション・Principal等の状態をテストごとに初期化・復元し、他のテストへ漏らさない。
- Issueの受入条件には業務上の期待結果を書く。ここで定めた共通テスト方式を各Issueへコピーしない。
