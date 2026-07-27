// 客户端导航期间的骨架屏过渡，改善用户感知性能
export default function Loading() {
    return (
        <div className="wiki-loading" aria-hidden="true">
            <div className="wiki-loading-title" />
            <div className="wiki-loading-meta" />
            <div className="wiki-loading-line" />
            <div className="wiki-loading-line" />
            <div className="wiki-loading-line" />
            <div className="wiki-loading-line short" />
        </div>
    );
}
