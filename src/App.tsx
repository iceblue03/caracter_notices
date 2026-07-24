import { Instagram, Twitter, Bell, Search, LayoutGrid, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MOCK_FEEDS } from './data';
import { ShopFeed } from './types';

export default function App() {
  const [feeds, setFeeds] = useState<ShopFeed[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // List of instagram handles to track
  const [trackedShops, setTrackedShops] = useState<string[]>(['smg_holdings', 'bandainamcokorea', 'nintendo_korea']);
  const [newShopInput, setNewShopInput] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/instagram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: trackedShops })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync with Apify');
      }
      
      if (data.feeds && data.feeds.length > 0) {
        // Merge with existing non-instagram feeds
        const twitterFeeds = feeds.filter(f => f.platform !== 'instagram');
        setFeeds([...data.feeds, ...twitterFeeds].sort((a, b) => {
          const timeA = new Date(a.postedAt).getTime();
          const timeB = new Date(b.postedAt).getTime();
          if (isNaN(timeA) && isNaN(timeB)) return 0;
          if (isNaN(timeA)) return 1;
          if (isNaN(timeB)) return -1;
          return timeB - timeA;
        }));
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSync();
  }, []);

  const handleAddShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (newShopInput.trim() && !trackedShops.includes(newShopInput.trim())) {
      setTrackedShops([...trackedShops, newShopInput.trim()]);
      setNewShopInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              덕질 & 서브컬처 팝업 모아보기
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="샵 또는 소식 검색..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none w-64"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Filters */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24 shadow-sm">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">플랫폼 필터</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium transition-colors">
                  <LayoutGrid size={18} />
                  전체보기
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
                  <Twitter size={18} className="text-sky-500" />
                  트위터 소식
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-colors">
                  <Instagram size={18} className="text-pink-600" />
                  인스타그램 소식
                </button>
              </div>

              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">관심 샵 목록 (인스타그램)</h2>
              <div className="space-y-3">
                {trackedShops.map(shop => (
                  <label key={shop} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-colors" />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">@{shop}</span>
                  </label>
                ))}
                
                <form onSubmit={handleAddShop} className="mt-4 flex gap-2">
                  <input 
                    type="text" 
                    value={newShopInput}
                    onChange={(e) => setNewShopInput(e.target.value)}
                    placeholder="인스타 ID 입력" 
                    className="flex-1 w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit" className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200">
                    추가
                  </button>
                </form>
              </div>
            </div>
          </aside>

          {/* Feed Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">최신 업데이트</h2>
              
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 text-sm font-medium bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {isSyncing ? '동기화 중...' : 'Apify로 소식 동기화'}
              </button>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <strong>동기화 실패:</strong> {error}
                <div className="mt-2 text-xs text-red-600 opacity-80">
                  AI Studio의 Settings(우측 상단 톱니바퀴) &gt; Secrets 패널에서 APIFY_API_TOKEN을 올바르게 설정했는지 확인해주세요.
                </div>
              </div>
            )}
            
            <div className="grid gap-6">
              {feeds.length === 0 ? (
                <div className="text-center py-12 text-slate-500">불러온 소식이 없습니다.</div>
              ) : feeds.map(feed => (
                <article key={feed.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    {/* Author Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={feed.avatarUrl.includes('dicebear') ? feed.avatarUrl : `/api/image-proxy?url=${encodeURIComponent(feed.avatarUrl)}`} alt={feed.shopName} className="w-10 h-10 rounded-full bg-slate-100 object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <h3 className="font-bold text-slate-900 leading-tight">{feed.shopName}</h3>
                          <span className="text-sm text-slate-500">{feed.handle}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {feed.platform === 'twitter' ? (
                          <Twitter size={18} className="text-sky-500" />
                        ) : (
                          <Instagram size={18} className="text-pink-600" />
                        )}
                        <span className="text-xs text-slate-400 font-medium">{feed.postedAt}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-4">
                      {feed.content}
                    </p>
                  </div>
                  
                  {/* Image */}
                  {feed.imageUrl && (
                    <div className="border-t border-slate-100">
                      <img src={`/api/image-proxy?url=${encodeURIComponent(feed.imageUrl)}`} alt="포스트 이미지" className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <a href={feed.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                      원본 글 보기 →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
