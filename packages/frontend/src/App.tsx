import { AllLinksResponse, AnalyticsInfo, LinkInfo, ShortenUrlRequest, ShortenUrlResponse } from '@url-shortener/shared-types';
import axios from 'axios';
import { FormEvent, useState } from 'react';
import './App.css';

interface StoredLink extends ShortenUrlResponse {
    originalUrl: string;
    shortId: string;
}

function App() {
    const [originalUrl, setOriginalUrl] = useState('');
    const [alias, setAlias] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [links, setLinks] = useState<StoredLink[]>([]);
    const [error, setError] = useState('');
    const [info, setInfo] = useState<LinkInfo | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsInfo | null>(null);
    const [allLinks, setAllLinks] = useState<AllLinksResponse[]>([]);
    const [showAllLinks, setShowAllLinks] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const request: ShortenUrlRequest = {
            originalUrl,
            alias: alias ?? undefined,
            expiresAt: expiresAt ?? undefined,
        };

        try {
            const { data } = await axios.post<ShortenUrlResponse>('/shorten', request);
            const shortId = data.shortUrl.split('/').pop()!;
            setLinks([...links, { ...data, originalUrl, shortId }]);
            setOriginalUrl('');
            setAlias('');
            setExpiresAt('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleGetInfo = async (shortId: string) => {
        try {
            setAnalytics(null);
            const { data } = await axios.get<LinkInfo>(`/info/${shortId}`);
            setInfo(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleGetAnalytics = async (shortId: string) => {
        try {
            setInfo(null);
            const { data } = await axios.get<AnalyticsInfo>(`/analytics/${shortId}`);
            setAnalytics(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleDelete = async (shortId: string, id: string) => {
        try {
            await axios.delete(`/delete/${shortId}`);
            setLinks(links.filter(link => link.id !== id));
            setAllLinks(allLinks.filter(link => link.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleShowAllLinks = async () => {
        try {
            setError('');
            const { data } = await axios.get<AllLinksResponse[]>('/all-links');
            setAllLinks(data);
            setShowAllLinks(!showAllLinks);
            setInfo(null);
            setAnalytics(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    return (
        <div className="container">
            <h1>URL Shortener</h1>
            <form onSubmit={handleSubmit} className="form">
                <input
                    type="url"
                    placeholder="Original URL"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Custom Alias (optional)"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                />
                <input
                    type="datetime-local"
                    placeholder="Expires At (optional)"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                />
                <button type="submit">Shorten</button>
            </form>

            {error && <p className="error">{error}</p>}

            <div className="actions">
                <button onClick={handleShowAllLinks} className="all-links-btn">
                    {showAllLinks ? 'Hide All Links' : 'Show All Links'}
                </button>
            </div>

            {showAllLinks ? (
                <div className="all-links">
                    <h2>All Links</h2>
                    {allLinks.map((link) => (
                        <div key={link.id} className="link-item">
                            <p><strong>Original:</strong> {link.originalUrl}</p>
                            <p><strong>Short:</strong> <a href={link.shortUrl} target="_blank" rel="noopener noreferrer">{link.shortUrl}</a></p>
                            <p><strong>Created:</strong> {new Date(link.createdAt).toLocaleString()}</p>
                            <p><strong>Clicks:</strong> {link.clickCount}</p>
                            <p><strong>Last 5 IPs:</strong></p>
                            <ul>
                                {link.lastFiveIps.map((ip, i) => <li key={i}>{ip}</li>)}
                            </ul>
                            <div className="link-actions">
                                <button onClick={() => handleDelete(link.shortId, link.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="links-list">
                    {links.map((link: StoredLink) => (
                        <div key={link.id} className="link-item">
                            <p><strong>Original:</strong> {link.originalUrl}</p>
                            <p><strong>Short:</strong> <a href={link.shortUrl} target="_blank" rel="noopener noreferrer">{link.shortUrl}</a></p>
                            <div className="link-actions">
                                <button onClick={() => handleGetInfo(link.shortId)}>Info</button>
                                <button onClick={() => handleGetAnalytics(link.shortId)}>Analytics</button>
                                <button onClick={() => handleDelete(link.shortId, link.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {info && (
                <div className="info-box">
                    <h2>Link Info</h2>
                    <p><strong>Original URL:</strong> {info.originalUrl}</p>
                    <p><strong>Created At:</strong> {new Date(info.createdAt).toLocaleString()}</p>
                    <p><strong>Click Count:</strong> {info.clickCount}</p>
                    <button onClick={() => setInfo(null)}>Close</button>
                </div>
            )}

            {analytics && (
                <div className="info-box">
                    <h2>Analytics</h2>
                    <p><strong>Click Count:</strong> {analytics.clickCount}</p>
                    <p><strong>Last 5 IPs:</strong></p>
                    <ul>
                        {analytics.lastFiveIps.map((ip, i) => <li key={i}>{ip}</li>)}
                    </ul>
                    <button onClick={() => setAnalytics(null)}>Close</button>
                </div>
            )}
        </div>
    );
}

export default App;
