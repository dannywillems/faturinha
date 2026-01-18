import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TestModeProvider } from './contexts/TestModeContext';
import { Layout } from './components/Layout';
import {
  Dashboard,
  Invoices,
  InvoiceForm,
  InvoiceView,
  Clients,
  ClientForm,
  Settings,
} from './pages';
import './i18n';
import './App.scss';

function App(): ReactElement {
  return (
    <TestModeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/:id/view" element={<InvoiceView />} />
            <Route path="invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/:id" element={<ClientForm />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TestModeProvider>
  );
}

export default App;
