// This is now the root page for the authenticated app.
// It will be wrapped by the (app) layout which handles authentication.
import AppLayout from './(app)/layout';
import DashboardPage from './(app)/page';

export default function Home() {
  return (
    <AppLayout>
      <DashboardPage openModal={() => {}} />
    </AppLayout>
  );
}
