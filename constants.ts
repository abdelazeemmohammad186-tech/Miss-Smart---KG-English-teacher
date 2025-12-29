
import { Curriculum, Grade } from './types';

export const CURRICULUM: Curriculum = {
  [Grade.KG1]: [
    {
      id: 1,
      title: "Meet and Greet!",
      vocabulary: ["hello", "good morning", "goodbye", "boy", "girl", "friends", "happy", "sad"],
      phonics: ["t: train, toys, turtle", "i: in, insect, ink"],
      math: ["Number: 1", "Shape: Circle", "Color: Red"],
      skills: ["Self-Introduction", "Expressing your feelings"],
      color: "bg-blue-400",
      icon: "fa-hand-peace",
      thematicImage: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=400&h=400&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "I Can Find it at School!",
      vocabulary: ["classroom", "teacher", "chair", "table", "board", "book", "pencil", "eraser", "crayon", "playground", "swing", "slide"],
      phonics: ["s: star, sun, school", "a: apple, ant", "n: nest, night, numbers"],
      math: ["Number: 2", "Shape: Square", "Color: Blue"],
      skills: ["Asking and answering questions", "Building confidence in speaking"],
      color: "bg-orange-400",
      icon: "fa-school",
      thematicImage: "https://images.unsplash.com/photo-1503676260728-1c00da07bb5e?q=80&w=400&h=400&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "My Body, My Care!",
      vocabulary: ["hair", "head", "face", "eyes", "ears", "nose", "mouth", "teeth", "arms", "hands", "legs", "feet"],
      phonics: ["p: pen, pants, pan", "h: heart, honey, helicopter", "d: dog, desk, dress", "r: rabbit, robot, rice"],
      math: ["Number: 3", "Shape: Star", "Color: Yellow"],
      skills: ["Hygiene actions"],
      color: "bg-teal-400",
      icon: "fa-child-reaching",
      thematicImage: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=400&h=400&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "My Family Picnic!",
      vocabulary: ["grandfather", "grandmother", "father", "mother", "sister", "brother", "garden", "tree", "flower", "grass", "fruits", "chocolate", "chips", "juice", "sandwich"],
      phonics: ["e: egg, eagle, elephant", "c: cow, cloud, cap", "k: kiwi, kick, kite", "m: mom, man, mud"],
      math: ["Numbers: 4 and 5", "Shapes: Heart and Triangle", "Colors: Green and Orange"],
      skills: ["Introducing family members", "Expressing likes and dislikes"],
      color: "bg-red-400",
      icon: "fa-basket-shopping",
      thematicImage: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=400&h=400&auto=format&fit=crop"
    }
  ],
  [Grade.KG2]: [
    {
      id: 1,
      title: "Little Bodies, Big Moves!",
      vocabulary: ["walk", "run", "jump", "skip", "kick", "play", "throw", "catch", "juice", "Jad", "kite", "Karma"],
      structure: ["I can jump", "I can run", "I play with my friends", "I can kick the ball", "I can throw the ball"],
      phonics: ["Letters: j and k"],
      math: ["Numbers: 1, 2"],
      skills: ["Teamwork and Cooperation", "Expressing Abilities", "Making Friends"],
      color: "bg-pink-400",
      icon: "fa-running",
      thematicImage: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?q=80&w=400&h=400&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Let's Get Dressed!",
      vocabulary: ["T-shirt", "dress", "trousers", "pants", "skirt", "shorts", "cap", "shoes", "socks", "donkey", "Dina", "mug", "mommy", "Mazen", "green", "grass", "guitar"],
      structure: ["I have a yellow T-shirt", "My dress is red"],
      phonics: ["Letters: d, m, and g"],
      math: ["Numbers: 3, 4, 5"],
      skills: ["Color Recognition", "Personal Expressions", "Take care of your belongings"],
      color: "bg-blue-400",
      icon: "fa-shirt",
      thematicImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400&h=400&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "My Week!",
      vocabulary: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "today", "tomorrow", "yesterday", "orange", "on", "Omneya", "bag", "bus", "bed", "Bassem", "flag", "flower", "Farida", "lamp", "leaf", "leg"],
      structure: ["What day is it?", "Tomorrow is Sunday", "I go to the park on Friday", "Today is Monday"],
      phonics: ["Letters: o, b, f, and l"],
      math: ["Numbers: 6, 7, 8"],
      skills: ["Sequencing & Logical Thinking", "Calendar and Date Literacy", "Time Management Foundations"],
      color: "bg-purple-400",
      icon: "fa-calendar-day",
      thematicImage: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=400&h=400&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "My Busy Day!",
      vocabulary: ["morning", "noon", "night", "breakfast", "lunch", "dinner", "water", "wolf", "watch", "cat", "colors", "camel", "rice", "rabbit", "ruler", "umbrella", "under"],
      structure: ["get up", "go to bed", "go to school", "have breakfast", "have lunch", "have dinner"],
      phonics: ["Letters: w, c, r, and u"],
      math: ["Numbers: 9, 10"],
      skills: ["Planning & Routine Building", "Time Awareness", "Responsibility"],
      color: "bg-teal-400",
      icon: "fa-clock",
      thematicImage: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?q=80&w=400&h=400&auto=format&fit=crop"
    }
  ]
};
