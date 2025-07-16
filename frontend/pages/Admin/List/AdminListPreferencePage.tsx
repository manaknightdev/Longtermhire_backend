
import React, { useRef } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext } from "@/context/Auth";
import { GlobalContext } from "@/context/Global";
import { useNavigate } from "react-router-dom";
import { LazyLoad } from "@/components/LazyLoad";
import { ModalSidebar } from "@/components/ModalSidebar";
import { MkdListTableV2 } from "@/components/MkdListTable";
import { AdminEditPreferencePage, AdminAddPreferencePage } from "@/routes/LazyLoad";

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
    header: 'First_name',
    accessor: 'first_name',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Last_name',
    accessor: 'last_name',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Phone',
    accessor: 'phone',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'Photo',
    accessor: 'photo',
    isSorted: false,
    isSortedDesc: false,
    mappingExist: false,
    mappings: {}
  },
{
    header: 'User_id',
    accessor: 'user_id',
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

interface AdminPreferenceListPageProps {}

const AdminPreferenceListPage = ({}: AdminPreferenceListPageProps) => {
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
            table={"preference"}
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
          <AdminAddPreferencePage setSidebar={setShowAddSidebar} />
        </ModalSidebar>
      </LazyLoad>

      {showEditSidebar && (
        <LazyLoad>
          <ModalSidebar
            isModalActive={showEditSidebar}
            closeModalFn={() => setShowEditSidebar(false)}
          >
            <AdminEditPreferencePage
              activeId={activeEditId}
              setSidebar={setShowEditSidebar}
            />
          </ModalSidebar>
        </LazyLoad>
      )}
    </>
  );
};

export default AdminPreferenceListPage;