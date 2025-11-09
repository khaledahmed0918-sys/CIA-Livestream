export interface QuranicVerse {
  verse: string;
  source?: string;
  interpretation?: string;
  translation?: string;
}

export const quranicVerses: QuranicVerse[] = [
  {
    verse: '﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾',
    source: '📖 سورة الشرح – الآية 6',
    interpretation: '💬 التفسير: وعد من الله أن كل شدة يتبعها رخاء، وكل ضيق وراءه فرج. ما من عسر إلا ومعه يسر مضاعف، لأن الله كررها للتأكيد على أن الفرج مضمون.',
    translation: 'God promises that after every hardship comes ease. Every difficulty is followed by relief, and God repeats this to emphasize that relief is guaranteed.'
  },
  {
    verse: '﴿ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسعَهَا ﴾',
    source: '📖 سورة البقرة – الآية 286',
    interpretation: '💬 التفسير: الله سبحانه لا يحمّل عباده ما لا يستطيعون تحمّله. كل ابتلاء أو تعب هو في حدود قدرتك، فلا تخف، لأن الله يعرف طاقتك أكثر مما تعرفها أنت.',
    translation: 'God does not burden anyone beyond their capacity. Every trial or difficulty is within your limits, so do not fear, for God knows your strength better than you do.'
  },
  {
    verse: '﴿ وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ﴾',
    source: '📖 سورة الطلاق – الآيتان 2-3',
    interpretation: '💬 التفسير: التقوى طريق الفرج. اللي يخاف الله ويبتعد عن الحرام، الله يسخّر له حلول من أماكن ما تخطر على باله، ويرزقه من حيث لا يتوقع.',
    translation: 'Piety is the path to relief. Whoever fears God and avoids wrongdoing, God will provide solutions from unexpected places and grant sustenance from sources they cannot imagine.'
  }
];
