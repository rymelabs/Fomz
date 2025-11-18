import React from 'react';
import { ArrowUp, ArrowDown, Copy, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const QuestionToolbar = ({ 
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  disableUp,
  disableDown
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveUp}
        disabled={disableUp}
        icon={ArrowUp}
        className="text-gray-600"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveDown}
        disabled={disableDown}
        icon={ArrowDown}
        className="text-gray-600"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onDuplicate}
        icon={Copy}
        className="text-gray-600"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        icon={Trash2}
        className="text-red-500"
      />
    </div>
  );
};

export default QuestionToolbar;
