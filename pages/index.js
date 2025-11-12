import { useEffect, useState } from "react";

function useTheme() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Check localStorage first, then system preference
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = stored || (prefersDark ? 'dark' : 'light');
        
        setTheme(initialTheme);
        const html = document.documentElement;
        if (initialTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        const html = document.documentElement;
        if (newTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    };

    return [theme, toggleTheme];
}

function getSentimentColor(sentiment) {
    switch (sentiment) {
        case 'positive':
            return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800';
        case 'negative':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200 border border-gray-200 dark:border-gray-600';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

export default function Home() {
    const [digest, setDigest] = useState([]);
    const [loading, setLoading] = useState(true);
    const [theme, toggleTheme] = useTheme();

    useEffect(() => {
        fetch("/digest.json")
            .then(res => res.json())
            .then(data => {
                setDigest(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <header className="mb-8 sm:mb-12">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-50 dark:via-gray-100 dark:to-gray-50 bg-clip-text text-transparent">
                                Trump Shit
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                Daily Digest • {digest.length} {digest.length === 1 ? 'article' : 'articles'}
                            </p>
                        </div>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-gray-900/20"
                            aria-label="Toggle theme"
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                        >
                            {theme === 'light' ? (
                                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-yellow-400 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </header>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 border-t-transparent"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && digest.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            No articles found. Check back later!
                        </p>
                    </div>
                )}

                {/* Articles Grid */}
                <div className="space-y-4 sm:space-y-6">
                    {digest.map((item) => (
                        <article 
                            key={item.url || item.title} 
                            className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm dark:shadow-gray-900/20 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-900/20 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-blue-500/50 hover:-translate-y-1 dark:hover:-translate-y-1 dark:hover:bg-gray-800/80 group relative"
                        >
                            <div className="p-6 sm:p-8 relative z-10">
                                {/* Article Header */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 transition-colors"
                                    >
                                        <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight line-clamp-2 text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative">
                                            {item.title || 'Untitled'}
                                        </h2>
                                    </a>
                                    <span className={`text-xs font-semibold uppercase px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${getSentimentColor(item.sentiment)}`}>
                                        {item.sentiment}
                                    </span>
                                </div>

                                {/* Meta Information */}
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    <span className="font-medium">{item.source || 'Unknown Source'}</span>
                                    <span className="text-gray-400 dark:text-gray-500">•</span>
                                    <time className="text-gray-600 dark:text-gray-400">{item.publishedAt ? formatDate(item.publishedAt) : 'Unknown date'}</time>
                                </div>

                                {/* Summary */}
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 mb-4">
                                    {item.summary || item.content || 'No summary available'}
                                </p>

                                {/* Read More Link */}
                                <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
                                >
                                    Read full article
                                    <svg 
                                        className="w-4 h-4 transition-transform group-hover/link:translate-x-1" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Footer */}
                <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700/50 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p className="text-gray-600 dark:text-gray-400">Updated automatically from multiple news sources</p>
                </footer>
            </div>
        </div>
    );
}
