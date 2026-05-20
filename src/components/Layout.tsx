import type { ReactNode, FC } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0f1014]">
      {!isLoginPage && <Navbar />}
      <main className={`flex-1 ${isLoginPage ? 'pt-0' : 'pt-16'}`}>
        {children}
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
};

export default Layout;