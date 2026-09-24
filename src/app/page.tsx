"use client";

import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Lock,
  Unlock,
  Calendar,
  MoreVertical,
  Plus,
  Minus,
  Trash2,
  Settings,
  FolderPlus,
  Folder,
  Layers,
  Sparkles,
} from "lucide-react";
import { format, differenceInDays, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subject, Chapter } from "@/types/studyflow";

const STORAGE_KEY = "studyflow_lite_db_v2";

const generateId = () =>
  "id-" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: "math-101",
    name: "Advanced Calculus",
    isLocked: false,
    chapters: [
      {
        id: "c1",
        subjectId: "math-101",
        name: "Limits & Continuity",
        totalLectures: 10,
        completedLectures: 4,
        deadline: null,
        isUnlocked: true,
        order: 1,
      },
      {
        id: "c2",
        subjectId: "math-101",
        name: "Derivatives & Chain Rule",
        totalLectures: 15,
        completedLectures: 0,
        deadline: null,
        isUnlocked: false,
        order: 2,
      },
    ],
  },
];

// Circular SVG Progress Ring Component
function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 6,
  primaryColor = "#00BFFF",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * radius * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

// Single Chapter Row Component
function ChapterRow({
  chapter,
  isSubjectLocked,
  onUpdateLecture,
  onUnlock,
  onSetDeadline,
  onEdit,
  onDelete,
}: {
  chapter: Chapter;
  isSubjectLocked: boolean;
  onUpdateLecture: (increment: boolean) => void;
  onUnlock: () => void;
  onSetDeadline: (deadline: string | null) => void;
  onEdit: (data: Partial<Chapter>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(chapter.name);
  const [lectures, setLectures] = useState(chapter.totalLectures.toString());
  const [unlocked, setUnlocked] = useState(chapter.isUnlocked);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isEditDialogOpen) {
      setName(chapter.name);
      setLectures(chapter.totalLectures.toString());
      setUnlocked(chapter.isUnlocked);
    }
  }, [isEditDialogOpen, chapter]);

  const percentage = (chapter.completedLectures / chapter.totalLectures) * 100;
  const isFinished = chapter.completedLectures === chapter.totalLectures;

  const today = startOfDay(new Date());
  const deadlineDate = chapter.deadline ? startOfDay(parseISO(chapter.deadline)) : null;
  const daysLeft = deadlineDate && mounted ? differenceInDays(deadlineDate, today) : null;
  const remainingLectures = chapter.totalLectures - chapter.completedLectures;
  const requiredRate =
    daysLeft && daysLeft > 0 ? (remainingLectures / daysLeft).toFixed(1) : null;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 border-none",
        chapter.isUnlocked ? "bg-card" : "bg-muted/30 opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3 gap-3 min-w-0">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden w-full">
              {chapter.isUnlocked ? (
                <Unlock className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 overflow-x-auto whitespace-nowrap no-scrollbar pr-2 py-0.5">
                <h4 className="font-bold text-base inline-block">{chapter.name}</h4>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold shrink-0">
                  {chapter.totalLectures} Lectures
                </p>
                {daysLeft !== null && chapter.isUnlocked && !isFinished && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0",
                      daysLeft < 3 ? "bg-red-500/20 text-red-400" : "bg-primary/10 text-primary"
                    )}
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    {daysLeft === 0
                      ? "Due Today"
                      : daysLeft < 0
                      ? "Overdue"
                      : `${daysLeft}d left`}
                  </div>
                )}
              </div>

              {!chapter.isUnlocked && (
                <div className="flex items-center gap-1 text-[8px] text-amber-500 font-black uppercase tracking-widest mt-1">
                  <Lock className="w-2 h-2" /> Excluded from active metrics
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-white"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[320px] rounded-2xl bg-card border-white/5">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit Chapter</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ch-name"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Name
                    </Label>
                    <Input
                      id="ch-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted border-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="ch-lectures"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Total Lectures
                    </Label>
                    <Input
                      id="ch-lectures"
                      type="number"
                      value={lectures}
                      onChange={(e) => setLectures(e.target.value)}
                      className="bg-muted border-none rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label
                      htmlFor="ch-status"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Unlocked Status
                    </Label>
                    <Switch
                      id="ch-status"
                      checked={unlocked}
                      onCheckedChange={setUnlocked}
                    />
                  </div>
                </div>
                <DialogFooter className="flex-row gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      onDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
                    onClick={() => {
                      onEdit({
                        name,
                        totalLectures: parseInt(lectures) || 1,
                        isUnlocked: unlocked,
                      });
                      setIsEditDialogOpen(false);
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {!chapter.isUnlocked && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-7 px-2 border-primary/50 text-primary hover:bg-primary/10 rounded-lg font-bold"
                onClick={onUnlock}
              >
                Unlock
              </Button>
            )}
          </div>
        </div>

        {chapter.isUnlocked && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                <span className="text-accent">{chapter.completedLectures} completed</span>
                <span className="text-muted-foreground">{Math.round(percentage)}%</span>
              </div>
              <Progress value={percentage} className="h-1.5 bg-muted" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10"
                  disabled={chapter.completedLectures === 0}
                  onClick={() => onUpdateLecture(false)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <div className="text-center min-w-[2.5rem]">
                  <span className="text-lg font-black text-primary">
                    {chapter.completedLectures}
                  </span>
                </div>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isFinished}
                  onClick={() => onUpdateLecture(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex-1 flex justify-end min-w-0">
                <div className="text-right min-w-0">
                  <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mb-1">
                    <Calendar className="w-3 h-3 text-primary shrink-0" />
                    <input
                      type="date"
                      className="bg-transparent border-none focus:ring-0 text-muted-foreground p-0 w-[84px] text-[10px] font-bold uppercase cursor-pointer"
                      value={chapter.deadline || ""}
                      onChange={(e) => onSetDeadline(e.target.value || null)}
                    />
                  </div>
                  {requiredRate && parseFloat(requiredRate) > 0 && (
                    <div className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg inline-block font-black uppercase tracking-tighter truncate max-w-full">
                      {requiredRate} lects / day
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Focus Wallet Top Banner / Carousel
function ActiveFocusWallet({
  subjects,
  onIncrement,
}: {
  subjects: Subject[];
  onIncrement: (subjectId: string, chapterId: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const activePairs = subjects
    .map((s) => {
      const activeChapter = s.chapters.find(
        (c) => c.isUnlocked && c.completedLectures < c.totalLectures
      );
      return activeChapter ? { subject: s, chapter: activeChapter } : null;
    })
    .filter((item): item is { subject: Subject; chapter: Chapter } => item !== null);

  if (activePairs.length === 0 || !mounted) return null;

  const today = startOfDay(new Date());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Active Focus Wallet
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground/50 uppercase font-black">
          {activePairs.length > 1 ? "Slide to switch" : "Tap to increment"}
        </span>
      </div>

      <Carousel className="w-full">
        <CarouselContent className="-ml-2">
          {activePairs.map(({ subject, chapter }) => {
            const deadlineDate = chapter.deadline
              ? startOfDay(parseISO(chapter.deadline))
              : null;
            const daysLeft = deadlineDate ? differenceInDays(deadlineDate, today) : null;
            const percentage =
              (chapter.completedLectures / chapter.totalLectures) * 100;

            return (
              <CarouselItem
                key={`${subject.id}-${chapter.id}`}
                className="pl-2 basis-full"
              >
                <Card
                  className="bg-[#1a1a1a] border border-primary/20 shadow-[0_10px_40px_rgba(0,191,255,0.08)] rounded-[2.5rem] overflow-hidden p-6 w-full cursor-pointer active:scale-[0.98] transition-all hover:border-primary/40 group relative"
                  onClick={() => onIncrement(subject.id, chapter.id)}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />

                  <div className="flex items-start justify-between mb-5 relative z-10 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center px-2 py-0.5 bg-primary/10 rounded-full text-[9px] font-black text-primary uppercase tracking-tighter mb-2 max-w-full">
                        <span className="truncate">{subject.name}</span>
                      </div>
                      <div className="text-2xl font-black text-white truncate leading-tight tracking-tight">
                        {chapter.name}
                      </div>

                      {daysLeft !== null && (
                        <div
                          className={cn(
                            "flex items-center gap-1 text-[10px] font-black uppercase mt-2.5",
                            daysLeft < 3 ? "text-red-400" : "text-accent"
                          )}
                        >
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {daysLeft === 0
                              ? "Due Today"
                              : daysLeft < 0
                              ? "Overdue"
                              : `${daysLeft} days left`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-primary shadow-[0_0_20px_rgba(0,191,255,0.4)] p-4 rounded-2xl text-primary-foreground group-active:scale-75 transition-transform duration-200 shrink-0">
                      <Plus className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between relative z-10 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-4xl font-black text-white flex items-baseline leading-none">
                        {chapter.completedLectures}
                        <span className="text-sm text-muted-foreground font-bold ml-2 tracking-normal uppercase shrink-0">
                          / {chapter.totalLectures} lects
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest truncate">
                        Auto-Sync Active
                      </div>
                    </div>

                    <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90 scale-110">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="rgba(255,255,255,0.03)"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#00BFFF"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray="175.9"
                          strokeDashoffset={175.9 - (percentage / 100) * 175.9}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-[10px] font-black text-white">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

// Subject Accordion List Component
function SubjectLibraryList({
  subjects,
  onUpdateLecture,
  onUnlock,
  onSetDeadline,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
}: {
  subjects: Subject[];
  onUpdateLecture: (
    subjectId: string,
    chapterId: string,
    increment: boolean
  ) => void;
  onUnlock: (subjectId: string, chapterId: string) => void;
  onSetDeadline: (
    subjectId: string,
    chapterId: string,
    deadline: string | null
  ) => void;
  onAddChapter: (
    subjectId: string,
    name: string,
    totalLectures: number,
    isUnlocked: boolean
  ) => void;
  onEditChapter: (
    subjectId: string,
    chapterId: string,
    data: Partial<Chapter>
  ) => void;
  onDeleteChapter: (subjectId: string, chapterId: string) => void;
}) {
  const [newChName, setNewChName] = useState("");
  const [newChLectures, setNewChLectures] = useState("10");
  const [newChUnlocked, setNewChUnlocked] = useState(true);
  const [activeSubjectModal, setActiveSubjectModal] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full space-y-3">
        {subjects.map((subject) => {
          const totalLectures = subject.chapters.reduce(
            (acc, ch) => acc + ch.totalLectures,
            0
          );
          const completedLectures = subject.chapters.reduce(
            (acc, ch) => acc + ch.completedLectures,
            0
          );
          const percentage =
            totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;
          const isComplete = percentage === 100 && totalLectures > 0;

          return (
            <AccordionItem
              key={subject.id}
              value={subject.id}
              className={cn(
                "border-none rounded-2xl px-4 overflow-hidden shadow-sm transition-opacity duration-300",
                subject.isLocked ? "bg-muted/10 opacity-60" : "bg-card"
              )}
            >
              <AccordionTrigger className="hover:no-underline py-5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
                <div className="flex items-center justify-between w-full gap-4 min-w-0 pr-2 relative">
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        subject.isLocked ? "bg-muted/20" : "bg-primary/10"
                      )}
                    >
                      {subject.isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Folder className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 text-left flex-1 overflow-hidden">
                      <div
                        className="overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 w-full cursor-default"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <h3
                          className={cn(
                            "font-bold text-lg leading-tight inline-block",
                            subject.isLocked ? "text-muted-foreground" : "text-white"
                          )}
                        >
                          {subject.name}
                        </h3>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest font-bold truncate">
                        {isComplete
                          ? "Subject Completed"
                          : `${completedLectures} / ${totalLectures} Lectures`}
                      </p>
                      {subject.isLocked && (
                        <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                          <Lock className="w-2 h-2" /> Excluded from active metrics
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-auto pl-2 flex items-center">
                    <CircularProgress
                      percentage={percentage}
                      size={50}
                      primaryColor={subject.isLocked ? "#666" : "#00BFFF"}
                    />
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-5 pt-2 border-t border-border/40">
                <div className="space-y-3 mt-4">
                  {subject.chapters.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-muted/20 rounded-2xl border-2 border-dashed border-border/20">
                      <Layers className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium italic">
                        No chapters added yet. Tap below to start.
                      </p>
                    </div>
                  ) : (
                    subject.chapters.map((ch) => (
                      <ChapterRow
                        key={ch.id}
                        chapter={ch}
                        isSubjectLocked={subject.isLocked}
                        onUpdateLecture={(inc) =>
                          !subject.isLocked &&
                          onUpdateLecture(subject.id, ch.id, inc)
                        }
                        onUnlock={() =>
                          !subject.isLocked && onUnlock(subject.id, ch.id)
                        }
                        onSetDeadline={(d) =>
                          !subject.isLocked && onSetDeadline(subject.id, ch.id, d)
                        }
                        onEdit={(data) => onEditChapter(subject.id, ch.id, data)}
                        onDelete={() => onDeleteChapter(subject.id, ch.id)}
                      />
                    ))
                  )}

                  {!subject.isLocked && (
                    <Dialog
                      open={activeSubjectModal === subject.id}
                      onOpenChange={(open) => {
                        if (open) setActiveSubjectModal(subject.id);
                        else {
                          setActiveSubjectModal(null);
                          setNewChName("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full border-2 border-dashed border-border/40 rounded-xl h-12 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add New Chapter
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[320px] rounded-2xl bg-card border-white/5">
                        <DialogHeader>
                          <DialogTitle className="text-white">New Chapter</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                              Chapter Name
                            </Label>
                            <Input
                              value={newChName}
                              onChange={(e) => setNewChName(e.target.value)}
                              placeholder="e.g. Integration"
                              className="bg-muted border-none rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                              Lectures
                            </Label>
                            <Input
                              type="number"
                              value={newChLectures}
                              onChange={(e) => setNewChLectures(e.target.value)}
                              className="bg-muted border-none rounded-xl"
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                              <Label className="text-[10px] font-bold uppercase text-white tracking-widest">
                                Initial Status
                              </Label>
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">
                                {newChUnlocked
                                  ? "Unlocked (Active)"
                                  : "Locked (Inactive)"}
                              </p>
                            </div>
                            <Switch
                              checked={newChUnlocked}
                              onCheckedChange={setNewChUnlocked}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            className="w-full rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-widest"
                            onClick={() => {
                              if (newChName) {
                                onAddChapter(
                                  subject.id,
                                  newChName,
                                  parseInt(newChLectures) || 10,
                                  newChUnlocked
                                );
                                setNewChName("");
                                setNewChUnlocked(true);
                                setActiveSubjectModal(null);
                              }
                            }}
                          >
                            Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// Main Page Component
export default function StudyFlowLite() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals state
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectLocked, setNewSubjectLocked] = useState(true);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize and load from local storage
  useEffect(() => {
    setIsMounted(true);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSubjects(parsed);
        else setSubjects(DEFAULT_SUBJECTS);
      } catch (e) {
        setSubjects(DEFAULT_SUBJECTS);
      }
    } else {
      setSubjects(DEFAULT_SUBJECTS);
    }
    setIsLoaded(true);
  }, []);

  // Save changes to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    }
  }, [subjects, isLoaded]);

  // Clean pointer events after dialog closure
  useEffect(() => {
    if (!isManageOpen && !subjectToDelete && !isAddSubjectOpen) {
      document.body.style.pointerEvents = "auto";
    }
  }, [isManageOpen, subjectToDelete, isAddSubjectOpen]);

  // Subject operations
  const addSubject = (name: string, isLocked = true) => {
    const newSubject: Subject = {
      id: generateId(),
      name,
      isLocked,
      chapters: [],
    };
    setSubjects((prev) => [...prev, newSubject]);
  };

  const toggleSubjectLock = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s))
    );
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // Chapter operations
  const addChapter = (
    subjectId: string,
    name: string,
    totalLectures: number,
    isUnlocked = true
  ) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        const newCh: Chapter = {
          id: generateId(),
          subjectId,
          name,
          totalLectures,
          completedLectures: 0,
          deadline: null,
          isUnlocked,
          order: s.chapters.length + 1,
        };
        return { ...s, chapters: [...s.chapters, newCh] };
      })
    );
  };

  const editChapter = (
    subjectId: string,
    chapterId: string,
    data: Partial<Chapter>
  ) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map((c) =>
            c.id === chapterId ? { ...c, ...data } : c
          ),
        };
      })
    );
  };

  const deleteChapter = (subjectId: string, chapterId: string) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.filter((c) => c.id !== chapterId),
        };
      })
    );
  };

  const unlockChapter = (subjectId: string, chapterId: string) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map((c) =>
            c.id === chapterId ? { ...c, isUnlocked: true } : c
          ),
        };
      })
    );
  };

  const setDeadline = (
    subjectId: string,
    chapterId: string,
    deadline: string | null
  ) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map((c) =>
            c.id === chapterId ? { ...c, deadline } : c
          ),
        };
      })
    );
  };

  // Sequential progression: increment/decrement lectures & auto-unlock next chapter
  const updateLecture = (
    subjectId: string,
    chapterId: string,
    increment: boolean
  ) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;

        const updatedChapters = s.chapters.map((c) => {
          if (c.id !== chapterId) return c;
          const nextCount = increment
            ? Math.min(c.completedLectures + 1, c.totalLectures)
            : Math.max(c.completedLectures - 1, 0);
          return { ...c, completedLectures: nextCount };
        });

        const targetChapter = updatedChapters.find((c) => c.id === chapterId);
        const updatedSubject = { ...s, chapters: updatedChapters };

        // Auto-unlock next sequential chapter if current reaches 100%
        if (
          targetChapter &&
          targetChapter.completedLectures === targetChapter.totalLectures
        ) {
          const subsequent = updatedChapters
            .filter((c) => c.order > targetChapter.order)
            .sort((a, b) => a.order - b.order);

          if (subsequent.length > 0 && !subsequent[0].isUnlocked) {
            const nextId = subsequent[0].id;
            updatedSubject.chapters = updatedChapters.map((c) =>
              c.id === nextId ? { ...c, isUnlocked: true } : c
            );
          }
        }

        // Auto-lock subject when all chapters are 100% completed
        const isSubjectFinished =
          updatedSubject.chapters.length > 0 &&
          updatedSubject.chapters.every(
            (c) => c.completedLectures === c.totalLectures
          );
        if (isSubjectFinished) {
          updatedSubject.isLocked = true;
        }

        return updatedSubject;
      })
    );
  };

  if (!isLoaded || !isMounted) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <BrainCircuit className="w-12 h-12 text-primary mb-4" />
          <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
            Initializing Flow
          </p>
        </div>
      </div>
    );
  }

  // Workload calculations: strictly across unlocked (active) subjects & chapters
  const activeSubjects = subjects.filter((s) => !s.isLocked);
  const totalActiveLectures = activeSubjects.reduce(
    (acc, s) =>
      acc + (s.chapters?.reduce((cAcc, c) => cAcc + (c.totalLectures || 0), 0) || 0),
    0
  );
  const completedActiveLectures = activeSubjects.reduce(
    (acc, s) =>
      acc +
      (s.chapters?.reduce(
        (cAcc, c) => cAcc + (c.completedLectures || 0),
        0
      ) || 0),
    0
  );
  const activeOverallProgress =
    totalActiveLectures > 0
      ? Math.round((completedActiveLectures / totalActiveLectures) * 100)
      : 0;

  const sortedSubjects = [...subjects].sort((a, b) =>
    a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1
  );

  return (
    <main className="min-h-screen bg-[#212121] px-4 py-8 max-w-md mx-auto">
      {/* 1. Active Focus Wallet */}
      <section className="mb-8">
        <ActiveFocusWallet
          subjects={activeSubjects}
          onIncrement={(subId, chId) => updateLecture(subId, chId, true)}
        />
      </section>

      {/* 2. Top Metric Cards */}
      <section className="mb-8 grid grid-cols-2 gap-4">
        <div className="bg-card rounded-[2rem] p-5 flex flex-col justify-between h-28 border border-white/5 shadow-sm">
          <div className="flex justify-between items-start">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-right">
              Active <br />
              Progress
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-white">
              {activeOverallProgress}
              <span className="text-sm font-medium text-muted-foreground ml-1">%</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">
              Course Done
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[2rem] p-5 flex flex-col justify-between h-28 border border-white/5 shadow-sm">
          <div className="flex justify-between items-start">
            <BrainCircuit className="w-4 h-4 text-accent" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-right">
              Active <br />
              Units
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-white">
              {completedActiveLectures}
              <span className="text-sm font-medium text-muted-foreground ml-1">
                /{totalActiveLectures || 0}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">
              Lectures
            </div>
          </div>
        </div>
      </section>

      {/* 3. Course Library */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-tight">
            Course Library
          </h2>
          <div className="flex items-center gap-1">
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-muted-foreground hover:text-white text-[9px] font-black uppercase tracking-widest px-2"
                >
                  <Settings className="w-3.5 h-3.5 mr-1" /> Manage
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-[320px] rounded-[2rem] bg-card border-white/5"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle className="text-white">Manage Subjects</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No subjects to manage.
                    </p>
                  ) : (
                    subjects.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-xl gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-xs font-bold truncate block",
                              sub.isLocked ? "text-muted-foreground" : "text-white"
                            )}
                          >
                            {sub.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg">
                            {sub.isLocked ? (
                              <Lock className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Unlock className="w-3 h-3 text-primary" />
                            )}
                            <Switch
                              checked={!sub.isLocked}
                              onCheckedChange={() => toggleSubjectLock(sub.id)}
                              className="scale-75"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => {
                              setIsManageOpen(false);
                              setTimeout(() => setSubjectToDelete(sub.id), 300);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-primary hover:bg-primary/10 text-[9px] font-black uppercase tracking-widest px-2"
                >
                  <FolderPlus className="w-3.5 h-3.5 mr-1" /> New Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[320px] rounded-[2rem] bg-card border-white/5">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Subject</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">
                      Subject Name
                    </Label>
                    <Input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Thermodynamics"
                      className="bg-muted border-none rounded-2xl h-12"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-bold uppercase text-white tracking-widest">
                        Initial Status
                      </Label>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">
                        {newSubjectLocked ? "Locked (Inactive)" : "Unlocked (Active)"}
                      </p>
                    </div>
                    <Switch
                      checked={!newSubjectLocked}
                      onCheckedChange={(checked) => setNewSubjectLocked(!checked)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest"
                    onClick={() => {
                      if (newSubjectName) {
                        addSubject(newSubjectName, newSubjectLocked);
                        setNewSubjectName("");
                        setNewSubjectLocked(true);
                        setIsAddSubjectOpen(false);
                      }
                    }}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card rounded-[2.5rem] border border-dashed border-white/5">
            <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Empty Library</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Start your journey by adding your first subject above.
            </p>
            <Button
              onClick={() => setIsAddSubjectOpen(true)}
              className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl px-6 h-11 font-bold text-[10px] uppercase tracking-widest"
            >
              <FolderPlus className="w-4 h-4 mr-2" /> Quick Start
            </Button>
          </div>
        ) : (
          <SubjectLibraryList
            subjects={sortedSubjects}
            onUpdateLecture={updateLecture}
            onUnlock={unlockChapter}
            onSetDeadline={setDeadline}
            onAddChapter={addChapter}
            onEditChapter={editChapter}
            onDeleteChapter={deleteChapter}
          />
        )}
      </section>

      {/* Delete Subject AlertDialog */}
      <AlertDialog
        open={subjectToDelete !== null}
        onOpenChange={(open) => !open && setSubjectToDelete(null)}
      >
        <AlertDialogContent
          className="max-w-[320px] rounded-2xl bg-card border-white/5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              This will permanently remove this subject and all its chapters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 rounded-xl bg-muted border-none text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (subjectToDelete) {
                  const id = subjectToDelete;
                  setSubjectToDelete(null);
                  setTimeout(() => {
                    deleteSubject(id);
                    document.body.style.pointerEvents = "auto";
                  }, 100);
                }
              }}
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer Branding */}
      <footer className="text-center pb-8 space-y-4">
        <div className="flex flex-col items-center gap-2 pt-8 border-t border-white/5">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 opacity-80">
              <Sparkles className="w-5 h-5 text-primary fill-primary" />
              <h1 className="text-xl font-black text-white tracking-tight">
                StudyFlow <span className="text-primary font-normal">Lite</span>
              </h1>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-60">
              Developed by Nandish
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 opacity-40 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
              Edge Storage Active
            </span>
          </div>

          <p className="text-[9px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto italic opacity-40">
            Optimized for PWA performance. All data remains offline.
          </p>
        </div>
      </footer>
    </main>
  );
}
