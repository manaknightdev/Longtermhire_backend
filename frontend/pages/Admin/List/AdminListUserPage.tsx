
import React, { useRef } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext } from "@/context/Auth";
import { GlobalContext } from "@/context/Global";
import { useNavigate } from "react-router-dom";
import { LazyLoad } from "@/components/LazyLoad";
import { ModalSidebar } from "@/components/ModalSidebar";
import { MkdListTableV2 } from "@/components/MkdListTable";
import { AdminEditUserPage, AdminAddUserPage } from "@/routes/LazyLoad";

let sdk = new MkdSDK();

const columns = [
  {
    header: "Row",
    accessor: "row",
  },
  {
    header: 'Id',
    accessor: 'id',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Email',
    accessor: 'email',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Password',
    accessor: 'password',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Login_type',
    accessor: 'login_type',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: true,
    mappings: {"0":"Regular","1":"Google","2":"Microsoft","3":"Apple","4":"Twitter","5":"Facebook"}
  },
{
    header: 'Role_id',
    accessor: 'role_id',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Data',
    accessor: 'data',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Status',
    accessor: 'status',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: true,
    mappings: {"0":"Active","1":"Inactive","2":"Suspend"}
  },
{
    header: 'Verify',
    accessor: 'verify',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Two_factor_authentication',
    accessor: 'two_factor_authentication',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Company_id',
    accessor: 'company_id',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Stripe_uid',
    accessor: 'stripe_uid',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Created_at',
    accessor: 'created_at',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
  {
    header: "Action",
    accessor: "",
  }
];

interface AdminUserListPageProps {}

const AdminUserListPage = ({}: AdminUserListPageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();

  const [showAddSidebar, setShowAddSidebar] = React.useState<boolean>(false);
  const [showEditSidebar, setShowEditSidebar] = React.useState<boolean>(false);
  const [activeEditId, setActiveEditId] = React.useState<number | null>(null);
  const refreshRef = useRef(null);

  const [selectedItems, setSelectedItems] = React.useState<number[]>([]);

  const onToggleModal = (modal: string, toggle: boolean, ids: number[] = []) => {
    switch (modal) {
      case "add":
        setShowAddSidebar(toggle);
        break;
      case "edit":
        setShowEditSidebar(toggle);
        setSelectedItems(ids);
        setActiveEditId(ids[0]);
        break;
    }
  };

  return (
    <>
      <div className="grid h-full max-h-full min-h-full w-full grid-cols-1 grid-rows-1 p-8">
        <LazyLoad>
          <MkdListTableV2
            columns={columns}
            useDefaultColumns={true}
            tableRole={"admin"}
            table={"user"}
            actionId={"id"}
            actions={{
              view: { show: true, action: null, multiple: false },
              edit: {
                show: true,
                multiple: false,
                action: (ids) => onToggleModal("edit", true, ids),
              },
              delete: { show: true, action: null, multiple: false },
              select: { show: true, action: null, multiple: false },
              add: {
                show: true,
                action: () => onToggleModal("add", true),
                multiple: false,
                children: "Add New",
                showChildren: true,
              },
              export: { show: false, action: null, multiple: true },
            }}
            actionPosition={["dropdown", "overlay"]}
            refreshRef={refreshRef}
            maxHeight={"grid-rows-[auto_1fr_auto]"}
          />
        </LazyLoad>
      </div>

      <LazyLoad>
        <ModalSidebar
          isModalActive={showAddSidebar}
          closeModalFn={() => setShowAddSidebar(false)}
        >
          <AdminAddUserPage setSidebar={setShowAddSidebar} />
        </ModalSidebar>
      </LazyLoad>

      {showEditSidebar && (
        <LazyLoad>
          <ModalSidebar
            isModalActive={showEditSidebar}
            closeModalFn={() => setShowEditSidebar(false)}
          >
            <AdminEditUserPage
              activeId={activeEditId}
              setSidebar={setShowEditSidebar}
            />
          </ModalSidebar>
        </LazyLoad>
      )}
    </>
  );
};

export default AdminUserListPage;