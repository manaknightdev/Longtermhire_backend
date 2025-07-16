
import React from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/context/Auth";
import { GlobalContext } from "@/context/Global";
import { SkeletonLoader } from "@/components/Skeleton";

let sdk = new MkdSDK();

interface ViewAdminPreferencePageProps {}

const ViewAdminPreferencePage = ({}: ViewAdminPreferencePageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [viewModel, setViewModel] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const params = useParams();
  
  const fetchData = async () => {
    try {
      setLoading(true);
      sdk.setTable("preference");
      const result = await sdk.callRestAPI(
        { id: Number(params?.id), join: "" },
        "GET"
      );
      if (!result.error) {
        setViewModel(result.model);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.log("error", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  React.useEffect(function() {
    fetchData();
  }, []);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          <h4 className="text-2xl font-medium">View Preference</h4>
          
    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Id</div>
        <div className="flex-1">{viewModel?.id}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">First_name</div>
        <div className="flex-1">{viewModel?.first_name}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Last_name</div>
        <div className="flex-1">{viewModel?.last_name}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Phone</div>
        <div className="flex-1">{viewModel?.phone}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Photo</div>
        <div className="flex-1">{viewModel?.photo}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">User_id</div>
        <div className="flex-1">{viewModel?.user_id}</div>
      </div>
    </div>
        </>
      )}
    </div>
  );
};

export default ViewAdminPreferencePage;