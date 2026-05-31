"use client";

import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, Loader2, Plus, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  createRoomEvent,
  createRoomSubject,
  createRoomTask,
  listenRoomEvents,
  listenRoomSubjects,
  listenRoomTasks,
  updateRoomTaskStatus,
} from "@/services/academic-service";
import type { RoomEvent, RoomEventKind, RoomSubject, RoomSubjectColor, RoomTask } from "@/types/academic";
import { formatRelativeDate } from "@/utils/date";

const subjectColors: RoomSubjectColor[] = ["blue", "emerald", "amber", "rose", "violet", "slate"];
const eventKinds: Array<{ label: string; value: RoomEventKind }> = [
  { label: "Aula", value: "class" },
  { label: "Prova", value: "exam" },
  { label: "Trabalho", value: "assignment" },
  { label: "Reuniao", value: "meeting" },
  { label: "Apresentacao", value: "presentation" },
];

const subjectColorClass: Record<RoomSubjectColor, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-slate-500",
};

function parseDateTime(value: string) {
  return value ? new Date(value) : null;
}

type AcademicHubProps = {
  roomId: string;
};

export function AcademicHub({ roomId }: AcademicHubProps) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<RoomSubject[]>([]);
  const [tasks, setTasks] = useState<RoomTask[]>([]);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState<RoomSubjectColor>("blue");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSubjectId, setEventSubjectId] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventKind, setEventKind] = useState<RoomEventKind>("class");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const onError = (error: Error) => toast.error(error.message);
    const unsubscribeSubjects = listenRoomSubjects(roomId, setSubjects, onError);
    const unsubscribeTasks = listenRoomTasks(roomId, setTasks, onError);
    const unsubscribeEvents = listenRoomEvents(roomId, setEvents, onError);

    return () => {
      unsubscribeSubjects();
      unsubscribeTasks();
      unsubscribeEvents();
    };
  }, [roomId]);

  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const openTasks = tasks.filter((task) => task.status === "open");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const nextEvents = events.filter((event) => !event.startsAt || event.startsAt >= new Date()).slice(0, 5);
  const xp = subjects.length * 15 + tasks.length * 20 + doneTasks.length * 35 + events.length * 20;

  const submitSubject = async () => {
    if (!user) return;

    setSaving("subject");
    try {
      await createRoomSubject({ roomId, userId: user.uid, name: subjectName, color: subjectColor });
      setSubjectName("");
      toast.success("Disciplina criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a disciplina.");
    } finally {
      setSaving(null);
    }
  };

  const submitTask = async () => {
    if (!user) return;

    setSaving("task");
    try {
      await createRoomTask({
        roomId,
        userId: user.uid,
        subjectId: taskSubjectId || null,
        title: taskTitle,
        description: taskDescription,
        dueAt: parseDateTime(taskDueAt),
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskSubjectId("");
      setTaskDueAt("");
      toast.success("Atividade criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a atividade.");
    } finally {
      setSaving(null);
    }
  };

  const submitEvent = async () => {
    if (!user) return;

    setSaving("event");
    try {
      await createRoomEvent({
        roomId,
        userId: user.uid,
        subjectId: eventSubjectId || null,
        title: eventTitle,
        description: eventDescription,
        startsAt: parseDateTime(eventStartsAt),
        kind: eventKind,
      });
      setEventTitle("");
      setEventDescription("");
      setEventSubjectId("");
      setEventStartsAt("");
      setEventKind("class");
      toast.success("Evento criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar o evento.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Disciplinas</CardTitle>
            <CardDescription>Separe a sala por materias para organizar tarefas, eventos e materiais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="subject-name">Nova disciplina</Label>
                <Input id="subject-name" value={subjectName} maxLength={80} onChange={(event) => setSubjectName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-color">Cor</Label>
                <select
                  id="subject-color"
                  value={subjectColor}
                  onChange={(event) => setSubjectColor(event.target.value as RoomSubjectColor)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {subjectColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" disabled={saving === "subject" || !subjectName.trim()} onClick={() => void submitSubject()}>
                {saving === "subject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Badge key={subject.id} variant="outline" className="gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${subjectColorClass[subject.color]}`} />
                  {subject.name}
                </Badge>
              ))}
              {!subjects.length ? <p className="text-sm text-muted-foreground">Nenhuma disciplina criada ainda.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
            <CardDescription>Crie entregas, prazos e acompanhe o que ja foi concluido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <Input value={taskTitle} maxLength={120} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Titulo da atividade" />
              <Input type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} />
              <select
                value={taskSubjectId}
                onChange={(event) => setTaskSubjectId(event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sem disciplina</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <Button type="button" disabled={saving === "task" || !taskTitle.trim()} onClick={() => void submitTask()}>
                {saving === "task" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                Criar atividade
              </Button>
            </div>
            <Textarea value={taskDescription} maxLength={1000} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Descricao, instrucoes ou criterios de entrega." />

            <div className="grid gap-3 lg:grid-cols-2">
              {openTasks.slice(0, 6).map((task) => (
                <article key={task.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{task.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.subjectId ? subjectById.get(task.subjectId)?.name ?? "Disciplina" : "Sem disciplina"}
                        {task.dueAt ? ` · prazo ${formatRelativeDate(task.dueAt)}` : ""}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="icon" title="Marcar como feita" onClick={() => void updateRoomTaskStatus(task.id, "done")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {task.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.description}</p> : null}
                </article>
              ))}
              {!openTasks.length ? <p className="text-sm text-muted-foreground">Nenhuma atividade aberta.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>Provas, reunioes, apresentacoes e lembretes da sala.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={eventTitle} maxLength={120} onChange={(event) => setEventTitle(event.target.value)} placeholder="Titulo do evento" />
            <Input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} />
            <select value={eventKind} onChange={(event) => setEventKind(event.target.value as RoomEventKind)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {eventKinds.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
            <select value={eventSubjectId} onChange={(event) => setEventSubjectId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Sem disciplina</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <Textarea value={eventDescription} maxLength={1000} onChange={(event) => setEventDescription(event.target.value)} placeholder="Descricao do evento." />
            <Button type="button" className="w-full" disabled={saving === "event" || !eventTitle.trim()} onClick={() => void submitEvent()}>
              {saving === "event" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              Criar evento
            </Button>
            <div className="space-y-2">
              {nextEvents.map((event) => (
                <article key={event.id} className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{eventKinds.find((kind) => kind.value === event.kind)?.label ?? event.kind}</Badge>
                    <span className="truncate text-sm font-medium">{event.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{event.startsAt ? formatRelativeDate(event.startsAt) : "Sem data"}</p>
                </article>
              ))}
              {!nextEvents.length ? <p className="text-sm text-muted-foreground">Nenhum evento futuro.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>XP da sala</CardTitle>
            <CardDescription>Gamificacao inicial baseada em organizacao e entregas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Trophy className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tracking-normal">{xp} XP</p>
                <p className="text-sm text-muted-foreground">{doneTasks.length} atividade{doneTasks.length === 1 ? "" : "s"} concluida{doneTasks.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              <div className="rounded-md border p-2"><BookOpen className="mx-auto mb-1 h-4 w-4" />{subjects.length} disciplinas</div>
              <div className="rounded-md border p-2"><ClipboardList className="mx-auto mb-1 h-4 w-4" />{tasks.length} tarefas</div>
              <div className="rounded-md border p-2"><CalendarDays className="mx-auto mb-1 h-4 w-4" />{events.length} eventos</div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}
