"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { listMyEvents, type Event } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function DashboardPage() {
  const { ready } = useRoleGuard("organizer");
  return ready ? <Dashboard /> : null;
}

const ROOMS = ["Sala A", "Sala B", "Sala C", "Sala D", "Sala E", "Sala F"];
const CHART_COLORS = ["#35415a", "#6fa043", "#eab14c", "#cb5741", "#8991a0", "#a2371f"];

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <p className="caption">{label}</p>
      <p className="text-2xl font-medium text-text">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-5">
      <h2 className="label">{title}</h2>
      <div className="h-64">{children}</div>
    </div>
  );
}

function Dashboard() {
  const { user, token } = useRoleGuard("organizer");
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    if (!token) return;
    listMyEvents(token).then(setEvents);
  }, [token]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="movie-title !text-2xl">Dashboard</h1>
        <p className="label">Olá, {user!.name}</p>
      </div>

      {events === null && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface-1" />
          ))}
        </div>
      )}

      {events?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="label">Crie um evento pra ver os números aparecerem aqui.</p>
        </div>
      )}

      {events && events.length > 0 && <DashboardBody events={events} />}
    </main>
  );
}

function DashboardBody({ events }: { events: Event[] }) {
  const published = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;
  const ticketsSold = events.reduce((sum, e) => sum + e.seats_sold, 0);
  const totalCapacity = events.reduce((sum, e) => sum + e.seat_count, 0);
  const revenue = events.reduce((sum, e) => sum + e.seats_sold * e.price, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;

  const byRoom = ROOMS.map((room) => ({
    room: room.replace("Sala ", ""),
    vendidos: events.filter((e) => e.local === room).reduce((sum, e) => sum + e.seats_sold, 0),
  }));

  const byFormat = [
    { name: "2D", value: events.filter((e) => e.format === "2D").reduce((s, e) => s + e.seats_sold, 0) },
    { name: "3D", value: events.filter((e) => e.format === "3D").reduce((s, e) => s + e.seats_sold, 0) },
  ].filter((d) => d.value > 0);

  const byLanguage = [
    {
      name: "Dublado",
      value: events.filter((e) => e.language === "Dublado").reduce((s, e) => s + e.seats_sold, 0),
    },
    {
      name: "Legendado",
      value: events.filter((e) => e.language === "Legendado").reduce((s, e) => s + e.seats_sold, 0),
    },
  ].filter((d) => d.value > 0);

  const topByRevenue = [...events]
    .map((e) => ({ title: e.title.length > 18 ? `${e.title.slice(0, 17)}…` : e.title, receita: e.seats_sold * e.price }))
    .filter((e) => e.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 6);

  const lowOccupancy = [...events]
    .filter((e) => e.status === "published" && e.seat_count > 0)
    .map((e) => ({ ...e, occupancy: e.seats_sold / e.seat_count }))
    .sort((a, b) => a.occupancy - b.occupancy)
    .slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Kpi label="Publicados" value={String(published)} />
        <Kpi label="Rascunhos" value={String(drafts)} />
        <Kpi label="Ingressos vendidos" value={String(ticketsSold)} />
        <Kpi label="Receita total" value={formatPrice(revenue)} />
        <Kpi label="Ocupação média" value={`${occupancyRate}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Ingressos vendidos por sala">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byRoom}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="room" tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="vendidos" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top eventos por receita">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topByRevenue} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
              <YAxis
                dataKey="title"
                type="category"
                width={110}
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatPrice(Number(value))}
                contentStyle={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="receita" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendas por formato">
          {byFormat.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byFormat} dataKey="value" nameKey="name" outerRadius={80} label={(d) => `${d.name} (${d.value})`} isAnimationActive={false}>
                  {byFormat.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-1)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="caption flex h-full items-center justify-center">Sem vendas ainda.</p>
          )}
        </ChartCard>

        <ChartCard title="Vendas por idioma">
          {byLanguage.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byLanguage} dataKey="value" nameKey="name" outerRadius={80} label={(d) => `${d.name} (${d.value})`} isAnimationActive={false}>
                  {byLanguage.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-1)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="caption flex h-full items-center justify-center">Sem vendas ainda.</p>
          )}
        </ChartCard>
      </div>

      {lowOccupancy.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-5">
          <h2 className="label">Sessões com menor ocupação</h2>
          <div className="flex flex-col divide-y divide-border">
            {lowOccupancy.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-text">{e.title}</p>
                  <p className="caption">{e.local}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(e.occupancy * 100)}%` }}
                    />
                  </div>
                  <span className="caption w-16 text-right">
                    {e.seats_sold}/{e.seat_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
