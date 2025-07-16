
import React from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/context/Auth";
import { GlobalContext } from "@/context/Global";
import { SkeletonLoader } from "@/components/Skeleton";

let sdk = new MkdSDK();

interface ViewAdminJobPageProps {}

const ViewAdminJobPage = ({}: ViewAdminJobPageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [viewModel, setViewModel] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const params = useParams();
  
  const fetchData = async () => {
    try {
      setLoading(true);
      sdk.setTable("job");
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
          <h4 className="text-2xl font-medium">View Job</h4>
          
    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Id</div>
        <div className="flex-1">{viewModel?.id}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Task</div>
        <div className="flex-1">{viewModel?.task}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Arguments</div>
        <div className="flex-1">{viewModel?.arguments}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Time_interval</div>
        <div className="flex-1">{viewModel?.time_interval}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Retries</div>
        <div className="flex-1">{viewModel?.retries}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Status</div>
        <div className="flex-1">{viewModel?.status}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Created_at</div>
        <div className="flex-1">{viewModel?.created_at}</div>
      </div>
    </div>

    <div className="mb-4 mt-4">
      <div className="flex mb-4">
        <div className="flex-1">Updated_at</div>
        <div className="flex-1">{viewModel?.updated_at}</div>
      </div>
    </div>
        </>
      )}
    </div>
  );
};

export default ViewAdminJobPage;