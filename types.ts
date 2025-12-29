
export enum Grade {
  KG1 = 'KG1',
  KG2 = 'KG2'
}

export enum TeachingMode {
  ARABIC_BILINGUAL = 'Bilingual (AR/EN)',
  ENGLISH_ONLY = 'Immersion (EN Only)'
}

export interface Unit {
  id: number;
  title: string;
  vocabulary: string[];
  phonics: string[];
  math: string[];
  structure?: string[];
  skills?: string[];
  color: string;
  icon: string;
  thematicImage: string;
}

export interface Curriculum {
  [Grade.KG1]: Unit[];
  [Grade.KG2]: Unit[];
}

export interface TeacherScript {
  warmUp: string;
  vocabulary: string;
  pronunciation: string;
  phonics: string;
  song: string;
  activity: string;
  revision: string;
}
