import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@devhop/ui";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { AuditDetail } from "../api/client";
import { useAuditDetail } from "../api/queries";

export function AuditDetailPage() {
  const search = useSearch({ from: "/app/audit/$id" });
  const nav = useNavigate({ from: "/app/audit/$id" });
  const { id } = useParams({ from: "/app/audit/$id" });

  const { data, ...result } = useAuditDetail(id);
  const item = data?.item;

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              ລາຍລະອຽດບັນທຶກການກວດກາ
            </h2>
            <p className="text-muted-foreground">ເບິ່ງລາຍລະອຽດຂອງບັນທຶກການກວດກາ.</p>
          </div>

          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/audit", search: { ...search } })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>
        <QueryState
          result={result}
          title="ກໍາລັງໂຫຼດບັນທຶກການກວດກາ"
          description="ກໍາລັງດຶງລາຍລະອຽດ"
          variant="fullscreen"
        >
          {!item ? null : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>ພາບລວມ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">ID</div>
                      <div className="col-span-2 break-all font-mono">
                        {item.id}
                      </div>
                      <div className="text-muted-foreground">ເກີດຂຶ້ນ</div>
                      <div className="col-span-2">
                        {item.occurredAt
                          ? formatDateTimeLocal(item.occurredAt)
                          : "-"}
                      </div>
                      <div className="text-muted-foreground">ການກະທໍາ</div>
                      <div className="col-span-2">
                        <Badge variant="secondary">{item.action}</Badge>
                      </div>
                      <div className="text-muted-foreground">ຜົນລັບ</div>
                      <div className="col-span-2">
                        <Badge
                          variant={
                            item.result === "failed" ? "destructive" : "success"
                          }
                        >
                          {item.result ?? "success"}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">ຜູ້ກະທໍາ</div>
                      <div className="col-span-2 break-all font-mono">
                        {item.actorId ?? "-"}
                      </div>
                      <div className="text-muted-foreground">ບົດບາດ</div>
                      <div className="col-span-2">{item.actorRole ?? "-"}</div>
                      <div className="text-muted-foreground">ວັດຖຸ</div>
                      <div className="col-span-2">
                        {item.entityType ?? "-"}{" "}
                        {item.entityId ? `#${item.entityId}` : ""}
                      </div>
                      <div className="text-muted-foreground">ເສັ້ນທາງ</div>
                      <div className="col-span-2 break-all font-mono">
                        {item.method} {item.path}
                      </div>
                      <div className="text-muted-foreground">ຄໍາຮ້ອງຂໍ</div>
                      <div className="col-span-2 break-all font-mono">
                        req={item.requestId ?? "-"} trace={item.traceId ?? "-"}
                      </div>
                      <div className="text-muted-foreground">ລູກຄ້າ</div>
                      <div className="col-span-2">
                        ip={item.ip ?? "-"} ua={item.userAgent ?? "-"}
                      </div>
                      {item.error ? (
                        <>
                          <div className="text-muted-foreground">ຂໍ້ຜິດພາດ</div>
                          <div className="col-span-2 break-words text-destructive">
                            {item.error}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>ກ່ອນ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(
                        (item as unknown as AuditDetail).before ?? null,
                        null,
                        2,
                      )}
                    </pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>ຫຼັງ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(
                        (item as unknown as AuditDetail).after ?? null,
                        null,
                        2,
                      )}
                    </pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>ເມຕາ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(
                        (item as unknown as AuditDetail).meta ?? null,
                        null,
                        2,
                      )}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </QueryState>
      </Main>
    </>
  );
}
