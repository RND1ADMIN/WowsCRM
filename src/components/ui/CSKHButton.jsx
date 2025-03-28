import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CSKHButton = ({ idCty, className = '', isSummary = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isSummary) {
      navigate(`/cskh?idCty=${idCty}`);
    } else {
      navigate(`/khtn/${idCty}/cskh`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm ${className}`}
    >
      {isSummary ? (
        <>
          <Calendar className="w-4 h-4" />
          Xem lịch chăm sóc
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          Thêm hoạt động CSKH
        </>
      )}
    </button>
  );
};

export default CSKHButton;