/**
 * Background images for a handful of works (see public/backgrounds/). Most
 * works have none — CharacterCard/CharacterDetailView fall back to the
 * procedural gradient when a title has no entry here.
 */
const BACKGROUND_FILES: Record<string, string> = {
  '기동경찰 패트레이버': '기동경찰 패트레이버.webp',
  '기동전사 건담 시리즈(우주세기)': '기동전사 건담 (우주세기).webp',
  '기동전사 건담 시리즈(헤이세이)': '기동전사 건담 (헤이세이).webp',
  '기동전사 건담 시리즈(신건담)': '기동전사 건담 (신건담).webp',
  '기동전사 건담 시리즈(토미노 오리지널)': '기동전사 건담(토미노 오리지널).webp',
  '동방 프로젝트': '동방 프로젝트.webp',
  '마리킨 온라인': '마리킨 온라인.png',
  '마크로스': '마크로스.jpeg',
  '신세기GPX 사이버 포뮬러': '신세기GPX 사이버 포뮬러.webp',
  '완간 미드나이트': '완간 미드나이트.avif',
  '용자경찰 제이데커': '용자경찰 제이데커.webp',
  '우주전함 야마토': '우주전함 야마토.webp',
  '이니셜 D': '이니셜 D.webp',
  '일상': '일상.webp',
  '전설거신 이데온': '전설거신 이데온.webp',
  '전투메카 자붕글': '전투메카 자붕글.webp',
  '천원돌파 그렌라간': '천원돌파 그렌라간.webp',

  '극주부도': '극주부도.webp',
  '내 최애는 막차를 탄다': '내 최애는 막차를 탄다.webp',
  '너를 너무너무너무너무 좋아하는 100명의 그녀': '너를 너무너무너무너무 좋아하는 100명의 그녀.webp',
  '너만 보인단 말이야': '너만 보인단 말이야.webp',
  '승리의 여신: 니케': '니케.jfif.jpg',
  '로젠 메이든': '로젠 메이든.webp',
  '리 레볼루션 하트': '리레볼루션.webp',
  '마왕인데 용사가 너무 많음': '마왕인데 용사가 너무 많음.webp',
  '명조: 워더링 웨이브': '명조.webp',
  '문호 스트레이독스': '문호 스트레이독스.jpg',
  '미타니 나나': '미타니.webp',
  // The "미호요" (HoYoverse) folder had 4 images; identified by content:
  // one was Genshin Impact (no matching title in this app, so it's unused),
  // the other 3 map to their specific games below.
  '붕괴 스타레일': '미호요.webp',
  '붕괴 3RD': '미호요2.webp',
  '젠레스 존 제로': '미호요3.webp',
  '블루 아카이브': '블루아카이브.webp',
  '세상에 나쁜 영애는 없다': '세상에 나쁜 영애는 없다.webp',
  '스텔라이브': '스텔라이브.jfif.jpg',
  '싸이코드': '싸이코드.webp',
  '아리도록': '아리도록.webp',
  '아카데미에서 살아남기': '아카데미에서 살아남기.webp',
  '악당들의 후원자가 되었다': '악당들의 후원자가 되었다.webp',
  '야미네 렌리': '야미네 렌리.webp',
  '여자사람 친구': '여자사람친구.webp',
  '오늘부터 신령님': '오늘부터 신령님.webp',
  '우마무스메 프리티 더비': '우마무스메.webp',
  '이세계 아이돌': '이세계아이돌.webp',
  '좋아하면 멍청해진다': '좋아하면 멍청해진다.webp',
  '키즈나 아이': '키즈나 아이.webp',
  '프로젝트 세카이 컬러풀 스테이지 feat.하츠네 미쿠': '프세카.webp',

  '86': '86에이티식스.webp',
  '귀멸의 칼날': '귀멸의 칼날.png',
  '그 비스크 돌은 사랑을 한다': '그 비스크돌은 사랑을 한다.webp',
  '드래곤볼': '드레곤볼.webp',
  '러브 라이브!': '러브라이브!.webp',
  '마녀배달부 키키': '마녀 배달부 키키.jpg',
  '명탐정 코난': '명탐정 코난.webp',
  '블리치': '블리치.jpeg',
  '샤를로트': '샤를로트.jpg',
  '스파이패밀리': '스파이X패밀리.webp',
  '원피스': '원피스.jpeg',
  '지박소년 하나코 군': '지박 소년 하나코 군.webp',
  '치이카와': '치이카와.webp',
  '카구야님은 고백받고 싶어': '카구야 님은 고백받고 싶어.jpg',
  '페이트 시리즈': '페이트.webp',
  '하울의 움직이는 성': '하울의 움직이는 성.jpg',
  '향기로운 꽃은 늠름하게 핀다': '향기로운 꽃은 늠름하게 핀다.jpeg',

  '강철의 연금술사': '강철의 연금술사.webp',
  '나루토': '나루토.webp',
  'RE:제로부터 시작하는 이세계 생활': '리제로(리 제로부터 시작하는 이세계 생활).jpg',
  '못 미더운 악녀입니다만': '못미더운 악녀입니다만.jpeg',
  '무직전생': '무직전생.jpeg',
  '봇치 더 록!': '봇치 더 락.webp',
  '불꽃 소방대': '불꽃소방대.png',
  '소울 이터': '소울이터.jpg',
  '스즈미야 하루히 시리즈': '스즈미야 히루히.jpeg',
  '어떤 과학의 초전자포': '어떤 과학의 초전자포.jpg',
  '전생했더니 슬라임이었던 건에 대하여': '전생했더니 슬라임이었던 건에 대하여.jpeg',
  '정반대의 너와 나': '정반대의 너와 나.jpg',
  '케이온!': '케이온.jpeg',
  '포켓몬스터': '포켓몬스터.jpeg',
  '흑집사': '흑집사.jpeg',
};

export function getBackgroundImage(title: string): string | undefined {
  const file = BACKGROUND_FILES[title];
  // Use Vite's configured base (e.g. "/caracter_notices/" on GitHub Pages)
  // rather than a bare "/", so these static assets resolve on a project subpath.
  return file ? `${import.meta.env.BASE_URL}backgrounds/${encodeURIComponent(file)}` : undefined;
}
