import apiClient from "./axios";

function baseURL(){ return apiClient?.defaults?.baseURL || "/api/v1"; }

export const rawApi = {
  async list(projectId, token){
    const {data}=await apiClient.get(`/projects/${projectId}/raw`,token?{headers:{Authorization:`Bearer ${token}`}}:{});
    return data;
  },
  async getContent(projectId,fileId,token,download=false){
    const {data}=await apiClient.get(`/projects/${projectId}/raw/${fileId}`,{
      headers: token?{Authorization:`Bearer ${token}`}:{},
      params: download?{download:true}:{},
      transformResponse:[(d,h)=>{
        const ct=(h["content-type"]||"").toLowerCase();
        if(ct.startsWith("text/plain")) return d;
        try{return JSON.parse(d);}catch{return d;}
      }]
    }); return data;
  },
  async del(projectId,fileId,token){
    await apiClient.delete(`/projects/${projectId}/raw/${fileId}`,token?{headers:{Authorization:`Bearer ${token}`}}:{});
  },
  async presign(projectId,filename,mime,token){
    const {data}=await apiClient.post(`/projects/${projectId}/raw/presign`,null,{
      params:{filename,mime},headers: token?{Authorization:`Bearer ${token}`}:{}
    }); return data;
  },
  async commit(projectId,payload,token){
    const {data}=await apiClient.post(`/projects/${projectId}/raw/commit`,payload,
      token?{headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}}:{}); return data;
  },
  async uploadBlob({projectId,blob,filename,mime,token,tags={}}){
    const ps=await this.presign(projectId,filename,mime,token);
    const form=new FormData(); Object.entries(ps.fields).forEach(([k,v])=>form.append(k,v));
    form.append("file",new File([blob],filename,{type:mime}));
    const r=await fetch(ps.url,{method:"POST",body:form});
    if(!r.ok) throw new Error(`S3 upload failed ${r.status}`);
    return this.commit(projectId,{project_id:projectId,key:ps.key,mime,size:blob.size,checksum:null,tags},token);
  },
  async updateInline({projectId,fileId,text,mime="text/plain",token}){
    const {data}=await apiClient.patch(`/projects/${projectId}/raw/${fileId}/inline`,
      {text,mime},token?{headers:{Authorization:`Bearer ${token}`}}:{}); return data;
  },
  async addInlineNote({projectId,text,filename="nota.txt",token}){
    const {data}=await apiClient.post(`/projects/${projectId}/raw/note`,
      {text,filename},token?{headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}}:{}); return data;
  },
  async transcribeToRaw({projectId,blob,createDoc=false,token}){
    const fd=new FormData();
    fd.append("audio",new File([blob],"grabacion.webm",{type:"audio/webm"}));
    const res=await fetch(`${baseURL()}/projects/${projectId}/raw/transcribe?create_doc=${createDoc?"true":"false"}`,{
      method:"POST",headers: token?{Authorization:`Bearer ${token}`}:{},body:fd});
    const ct=(res.headers.get("content-type")||"").toLowerCase();
    const data=ct.includes("json")?await res.json():await res.text();
    if(!res.ok){const msg=typeof data==="string"?data:data?.detail;throw{response:{status:res.status,data:{detail:msg}},message:msg};}
    return data;
  }
};