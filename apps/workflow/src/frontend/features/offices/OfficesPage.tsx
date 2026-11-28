import { AppsScriptRpcError } from "@gasboost/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppType } from "../../../backend/main";
import { officeName } from "../../../shared/office";
import { routes } from "../../../shared/routes";
import { useAuth } from "../../contexts/AuthContext";
import { client } from "../../lib/auth-rpc";

const formSchema = z.object({ name: officeName });
type Office = AppType["listOffices"]["result"][number];

export function OfficesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["offices", user?.id];
  const offices = useQuery({
    queryKey,
    queryFn: () => client.listOffices(),
  });
  const [editing, setEditing] = useState<Office | null>(null);
  const [retiring, setRetiring] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });
  useEffect(() => {
    if (editing) setFocus("name");
  }, [editing, setFocus]);

  const save = useMutation({
    mutationFn: async ({ name }: z.output<typeof formSchema>) => {
      if (editing) {
        await client.renameOffice({ id: editing.id, name });
      } else {
        await client.createOffice({ name });
      }
    },
    onSuccess: async () => {
      setEditing(null);
      reset({ name: "" });
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const retire = useMutation({
    mutationFn: (id: string) => client.retireOffice({ id }),
    onSuccess: async () => {
      setRetiring(null);
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const busy = save.isPending || retire.isPending;
  const operationError = save.error ?? retire.error;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <header className="space-y-3">
        <Link className="text-sm underline underline-offset-4" to={routes.home}>
          ホームに戻る
        </Link>
        <h1 className="text-2xl font-semibold">拠点管理</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "拠点名の変更" : "拠点の新設"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-2"
            onSubmit={handleSubmit((values) => {
              retire.reset();
              save.mutate(values);
            })}
          >
            <label className="text-sm font-medium" htmlFor="office-name">
              拠点名
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="office-name"
                className="h-9 min-w-40 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive"
                {...register("name")}
                readOnly={busy}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "office-name-error" : undefined}
              />
              <Button type="submit" disabled={busy}>
                {editing ? "変更を保存" : "新設する"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    save.reset();
                    setEditing(null);
                    reset({ name: "" });
                  }}
                >
                  変更をキャンセル
                </Button>
              )}
            </div>
            {errors.name && (
              <p
                id="office-name-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {operationError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {operationError instanceof AppsScriptRpcError
              ? operationError.message
              : "操作に失敗しました。時間をおいて再試行してください。"}
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="office-list-heading" className="space-y-2">
        <h2 id="office-list-heading" className="text-lg font-semibold">
          拠点一覧
        </h2>
        {offices.isPending && <p role="status">拠点を読み込み中…</p>}
        {offices.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              拠点一覧を取得できませんでした。
              <Button variant="link" onClick={() => void offices.refetch()}>
                再読み込み
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {offices.data?.length === 0 && <p>登録済みの拠点はありません。</p>}
        {!!offices.data?.length && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    拠点名
                  </th>
                  <th scope="col" className="px-4 py-3">
                    状態
                  </th>
                  <th scope="col" className="px-4 py-3">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {offices.data.map((office) => (
                  <tr key={office.id} className="border-t">
                    <th
                      scope="row"
                      className="min-w-32 px-4 py-3 text-left font-medium"
                    >
                      {office.name}
                    </th>
                    <td className="whitespace-nowrap px-4 py-3">
                      {office.status === "active" ? "有効" : "廃止"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {retiring === office.id ? (
                          <>
                            <span>この拠点を廃止しますか？</span>
                            <Button
                              variant="destructive"
                              disabled={busy}
                              onClick={() => {
                                save.reset();
                                retire.mutate(office.id);
                              }}
                            >
                              廃止する
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                retire.reset();
                                setRetiring(null);
                              }}
                            >
                              キャンセル
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                save.reset();
                                setEditing(office);
                                reset({ name: office.name });
                              }}
                            >
                              名称変更
                            </Button>
                            {office.status === "active" && (
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  retire.reset();
                                  setRetiring(office.id);
                                }}
                              >
                                廃止
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
