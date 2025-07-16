


import { useMemo } from "react";
import { operations } from "@/utils";
import TreeSDK from "@/utils/TreeSDK";
import MkdSDK from "@/utils/MkdSDK";
import SuperAdminSDK from "@/utils/SuperAdminSDK";
import MemberSDK from "@/utils/MemberSDK";

interface SdkConfig {
  baseurl?: string;
  fe_baseurl?: string;
  project_id?: string;
  secret?: string;
  table?: string;
}

interface UseSDKReturnType {
  sdk: MkdSDK;
  superAdminSdk: SuperAdminSDK;
memberSdk: MemberSDK;
  tdk: TreeSDK;
  projectId: string,
  operations: typeof operations;
}

const useSDK = (config: SdkConfig = {}): UseSDKReturnType => {
  const sdk = useMemo(() => {
    return new MkdSDK(config);
  }, [MkdSDK]);
  
  
    const superAdminSdk = useMemo(() => {
      return new SuperAdminSDK(config);
    }, [SuperAdminSDK]);
    

    const memberSdk = useMemo(() => {
      return new MemberSDK(config);
    }, [MemberSDK]);
    

  const tdk = useMemo(() => {
    return new TreeSDK(config);
  }, [TreeSDK]);

  const projectId = sdk.getProjectId()

  return { 
  sdk,
  tdk,
  projectId,
  operations, 
  superAdminSdk,
memberSdk
  };
};

export default useSDK;
