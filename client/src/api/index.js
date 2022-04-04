
import axios from 'axios'
axios.defaults.withCredentials = true;
let api = null;
api = axios.create({
	baseURL: 'http://localhost:4000/',
});
// THESE ARE ALL THE REQUESTS WE`LL BE MAKING, ALL REQUESTS HAVE A
// REQUEST METHOD (like get) AND PATH (like /top5list). SOME ALSO
// REQUIRE AN id SO THAT THE SERVER KNOWS ON WHICH LIST TO DO ITS
// WORK, AND SOME REQUIRE DATA, WHICH WE CALL THE payload, FOR WHEN
// WE NEED TO PUT THINGS INTO THE DATABASE OR IF WE HAVE SOME
// CUSTOM FILTERS FOR QUERIES
export const postOp = (id,payload) => api.post(`/op/${id}`, payload, {
	headers: {
	  // Overwrite Axios's automatically set Content-Type
	  'Content-Type': 'text/json'
	}
  })

const apis = {
	postOp
}

export default apis
