const url = "https://scontent-yyz1-1.cdninstagram.com/v/t51.71878-15/500109499_1202184424731214_4679448305502588825_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=scontent-yyz1-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2gGG5USsw20nioW9HRcsyXrOd_EFNOZjmoEC32E5MGtCBKy7zK8QWC9Ko1byz8_zn2s&_nc_ohc=nDT24r58Fd8Q7kNvwEwmCfm&_nc_gid=eTEI9porupq_wEasdGvhsQ&edm=APU89FABAAAA&ccb=7-5&oh=00_AQCUCVVU8QcteElClr_o5RGEUM0LYg5q_gXBN6PzKBER_w&oe=6A68D671&_nc_sid=bc0c2c";
async function run() {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const buf = await res.arrayBuffer();
    console.log("Size:", buf.byteLength);
  } catch (e) {
    console.error(e);
  }
}
run();
