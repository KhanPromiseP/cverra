import { Outlet } from 'react-router';

export const CoverLetterLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">

      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
