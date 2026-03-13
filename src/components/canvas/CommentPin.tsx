import React, { useState } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Comment } from '../../types';

interface CommentPinProps {
  comment: Comment;
  x: number;
  y: number;
}

export function CommentPin({ comment, x, y }: CommentPinProps) {
  const [open, setOpen] = useState(!comment.text);
  const [text, setText] = useState(comment.text);
  const updateComment = useStore((s) => s.updateComment);
  const resolveComment = useStore((s) => s.resolveComment);
  const deleteComment = useStore((s) => s.deleteComment);

  const submit = () => {
    if (text.trim()) {
      updateComment(comment.id, text);
    } else {
      deleteComment(comment.id);
    }
    setOpen(false);
  };

  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 200 }}>
      {/* Pin */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50% 50% 50% 0',
          backgroundColor: comment.resolved ? '#666' : '#f59e0b',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transform: 'rotate(-45deg)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        <MessageSquare size={12} style={{ transform: 'rotate(45deg)', color: 'white' }} />
      </div>

      {/* Popup */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: -8,
            minWidth: 220,
            backgroundColor: '#2c2c2c',
            border: '1px solid #3a3a3a',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 300,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11, color: '#aaa' }}>{comment.author}</span>
            <div className="flex gap-1">
              {comment.text && !comment.resolved && (
                <button
                  onClick={() => resolveComment(comment.id)}
                  style={{ padding: '2px', color: '#4ade80', cursor: 'pointer' }}
                >
                  <Check size={12} />
                </button>
              )}
              <button
                onClick={() => deleteComment(comment.id)}
                style={{ padding: '2px', color: '#f87171', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {comment.resolved ? (
            <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>{comment.text}</p>
          ) : (
            <>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                style={{
                  width: '100%',
                  minHeight: 60,
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #3a3a3a',
                  borderRadius: 4,
                  color: '#e0e0e0',
                  fontSize: 12,
                  padding: '6px 8px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={submit}
                  style={{
                    backgroundColor: '#0d99ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {comment.text ? 'Update' : 'Comment'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
