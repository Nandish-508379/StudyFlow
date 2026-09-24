export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  totalLectures: number;
  completedLectures: number;
  deadline: string | null;
  isUnlocked: boolean;
  order: number;
}

export interface Subject {
  id: string;
  name: string;
  isLocked: boolean;
  chapters: Chapter[];
}
