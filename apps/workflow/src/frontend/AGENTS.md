# Frontendの実装・テスト規約

`src/frontend/` に適用する。[アプリ全体の規約](../../AGENTS.md) と併せて読む。Frontendに対応する `tests/` の作業時にも本規約を適用する。

## 機能の配置とコンポーネント

- 業務機能は `features/` 配下にfeature単位で整理する。既存のRegistry由来のAuth、AuthContext、Guard、Routes等を再実装しない。
- コンポーネントを細かく分割しすぎない。分割は原則として、再利用が必要になったとき、または状態と振る舞いをそのコンポーネント内で **完全に閉じられる** ときに行う。JSXが長いという理由だけで抽出しない。
- UIは既存の **shadcn/uiコンポーネントを優先** し、同等のコンポーネントをゼロから作らない。gasboostの既存UI Registryも確認する。

## フォーム・通信・状態

- フォームには **React Hook Formの `useForm` + Zod + `zodResolver`** を使う。
- API通信は `src/frontend/lib/appsscript.ts` の既存 **`appsScriptClient`** を使う。独自RPCクライアントを作らない。
- Backendの `src/backend/main.ts` から `InferAppsScript<typeof app>` で推論した既存 `AppType` を `import type` で参照する。Backendの実行コードを取り込まず、入出力型の共有用に独自のAPI契約を重複定義しない。
- サーバー状態の取得・更新は **TanStack Queryの `useQuery` / `useMutation`** を使う。フォームの入力状態やローカルUI状態までQueryで管理しない。TanStack Queryを薄く包むだけの独自hookを乱立させない。
- 権限による表示制御には `components/Guard.tsx` の既存 **`Can`** 等の認可UIを使う。Frontendの表示制御はセキュリティ境界とみなさず、APIのサーバー側認可を必須とする。

## Frontendテスト

- Frontend実装には対応するテストを必ず追加・更新し、`tests/` に置く。
- **React Testing Library / Vitest** を使い、ユーザー操作、フォームの検証、データ取得・更新の状態、権限による表示、エラー表示など、その機能で該当する振る舞いを検証する。不要な観点まで機械的に増やさない。
- 実コンポーネントとTanStack Queryの挙動を検証し、通信境界は必要に応じて代替する。テストごとのキャッシュ・認証状態等を独立させる。
- 現行のVitest設定・依存を確認し、必要なテスト環境は対象機能のIssueで整備する。テストのために本番コードへ不要な抽象化・ラッパーを追加しない。
