

    
import { AdminWrapper } from "Components/AdminWrapper";

import { 

    AdminListJobPage,
    AdminAddJobPage,
    AdminEditJobPage,
    AdminViewJobPage,

    AdminListUploadsPage,
    AdminAddUploadsPage,
    AdminEditUploadsPage,
    AdminViewUploadsPage,

    AdminListTokensPage,
    AdminAddTokensPage,
    AdminEditTokensPage,
    AdminViewTokensPage,

    AdminListPreferencePage,
    AdminAddPreferencePage,
    AdminEditPreferencePage,
    AdminViewPreferencePage,

    AdminListUserPage,
    AdminAddUserPage,
    AdminEditUserPage,
    AdminViewUserPage
} from "./LazyLoad";


<Route
  exact
  path="/admin/job"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/job"
      element={
        <AdminWrapper>
          <AdminJobListPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/add-job"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/add-job"
      element={
        <AdminWrapper>
          <AdminAddJobPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/edit-job/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/edit-job/:id"
      element={
        <AdminWrapper>
          <AdminEditJobPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/view-job/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/view-job/:id"
      element={
        <AdminWrapper>
          <AdminViewJobPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/uploads"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/uploads"
      element={
        <AdminWrapper>
          <AdminUploadsListPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/add-uploads"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/add-uploads"
      element={
        <AdminWrapper>
          <AdminAddUploadsPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/edit-uploads/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/edit-uploads/:id"
      element={
        <AdminWrapper>
          <AdminEditUploadsPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/view-uploads/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/view-uploads/:id"
      element={
        <AdminWrapper>
          <AdminViewUploadsPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/tokens"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/tokens"
      element={
        <AdminWrapper>
          <AdminTokensListPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/add-tokens"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/add-tokens"
      element={
        <AdminWrapper>
          <AdminAddTokensPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/edit-tokens/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/edit-tokens/:id"
      element={
        <AdminWrapper>
          <AdminEditTokensPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/view-tokens/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/view-tokens/:id"
      element={
        <AdminWrapper>
          <AdminViewTokensPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/preference"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/preference"
      element={
        <AdminWrapper>
          <AdminPreferenceListPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/add-preference"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/add-preference"
      element={
        <AdminWrapper>
          <AdminAddPreferencePage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/edit-preference/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/edit-preference/:id"
      element={
        <AdminWrapper>
          <AdminEditPreferencePage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/view-preference/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/view-preference/:id"
      element={
        <AdminWrapper>
          <AdminViewPreferencePage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/user"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/user"
      element={
        <AdminWrapper>
          <AdminUserListPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/add-user"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/add-user"
      element={
        <AdminWrapper>
          <AdminAddUserPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/edit-user/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/edit-user/:id"
      element={
        <AdminWrapper>
          <AdminEditUserPage />
        </AdminWrapper>
      }
    />
  }
/>

<Route
  exact
  path="/admin/view-user/:id"
  element={
    <PrivateRoute
      access="admin"
      path="/admin/view-user/:id"
      element={
        <AdminWrapper>
          <AdminViewUserPage />
        </AdminWrapper>
      }
    />
  }
/>
    