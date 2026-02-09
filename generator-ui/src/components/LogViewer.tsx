import { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useGeneratorStore } from '../stores/generatorStore';

export default function LogViewer() {
  const { logs, clearLogs } = useGeneratorStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center gap-2 text-gray-300">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-medium">로그</span>
        </div>
        <button
          onClick={clearLogs}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="로그 지우기"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Log Content */}
      <div
        ref={containerRef}
        className="h-64 overflow-auto p-4 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <p className="text-gray-500">로그가 없습니다.</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="text-gray-300 py-0.5 hover:bg-gray-800"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
