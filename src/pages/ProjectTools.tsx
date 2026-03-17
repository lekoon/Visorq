import React, { useState } from 'react';
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2, Download, Briefcase, FileBarChart } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';

const ProjectTools: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { addAlert } = useStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.mpp')) {
        setFile(selectedFile);
        setStatus('idle');
        setErrorMessage('');
      } else {
        addAlert({
          type: 'error',
          message: '不支持的文件格式，请选择 .mpp 文件',
          date: new Date().toISOString()
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/tools/mpp-to-ppt', formData, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name.replace('.mpp', '.pptx'));
      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatus('success');
      addAlert({
        type: 'success',
        message: 'MMP 转 PPT 转换成功，已开始下载',
        date: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Conversion error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || '转换失败，请检查后端服务是否启动。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-blue-600" />
            项目工具箱
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            提供项目管理过程中的自动化小工具，提升工作效率。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tool Card: MPP to PPT */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileBarChart size={24} />
            </div>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              推荐
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">MMP 转 PPT</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 min-h-[40px]">
            将 Microsoft Project (.mpp) 文件一键转换为可编辑的 PowerPoint (.pptx) 甘特图。
          </p>

          <div className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${file ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400'}
              `}
              onClick={() => document.getElementById('mpp-upload')?.click()}
            >
              <input 
                type="file" 
                id="mpp-upload" 
                className="hidden" 
                accept=".mpp" 
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                {file ? (
                  <>
                    <FileType className="text-blue-500" size={32} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-full">
                      {file.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400" size={32} />
                    <span className="text-sm text-slate-500">点击或拖拽上传 .mpp 文件</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                ${!file || uploading 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]'}
              `}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  正在转换 (需调用本地 Office)...
                </>
              ) : status === 'success' ? (
                <>
                  <Download size={20} />
                  重新下载 PPT
                </>
              ) : (
                '开始转换'
              )}
            </button>

            {status === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-lg text-sm">
                <CheckCircle2 size={16} />
                转换成功！文件已开始下载。
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Placeholder for future tools */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center opacity-70">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 mb-4">
            <Plus size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">更多工具</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            即将推出：Excel 自动化、文档模板生成等。
          </p>
        </div>
      </div>
    </div>
  );
};

// Simple Plus icon if not imported from lucide
const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default ProjectTools;
