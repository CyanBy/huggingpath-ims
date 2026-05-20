import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Datasets from './pages/Datasets';
import ModelDetail from './pages/ModelDetail';
import Workbench from './pages/Workbench';
import WorkbenchCaseLibrary from './pages/WorkbenchCaseLibrary';
import About from './pages/About';
import Login from './pages/Login';
import CaseLibrary from './pages/CaseLibrary';
import CaseDetail from './pages/CaseDetail';
import WorkbenchResearchProjects from './pages/WorkbenchResearchProjects';

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Explore />} />
          <Route path="/home" element={<Home />} />
          <Route path="/cases" element={<CaseLibrary />} />
          <Route path="/cases/:caseId" element={<CaseDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/model/:id" element={<ModelDetail />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/workbench/projects" element={<WorkbenchResearchProjects />} />
          <Route path="/workbench/cases" element={<WorkbenchCaseLibrary />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;