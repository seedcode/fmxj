#fmxj.js
##A Javascript approach to FileMaker Custom Web Publishing

###With fmxj.js and simple JavaScript Objects you can

* Build complex queries and POST them to FileMaker Server
* Return FileMaker parent and child records as JavaScript Objects/JSON
* Create, edit and delete FileMaker records
* Filter and sort Javascript objects locally with complex criteria.

fmxj.js is designed to do the data interchange work with FileMaker Server in JavaScript. Query strings are created from JavaScript Objects and then POSTED to FileMaker's XML Web Publishing Engine. An XML FMPXMLRESULT is returned and converted into JavaScript Objects/JSON by fmxj. POSTS can be done directly to the FileMaker Server's XML WPE or a simple PHP relay can be used to get around cross-domain issues and provide more authentication options.  See more on the PHP relay below in the **postQueryFMS()** function.

Working examples and basic function descriptions are available at the <a href="http://www.seedcode.com/fmxj/fmxj.html" target="_blank">fmxj example page</a>.

###`postQueryFMS ( query, callBackOnReady [, callBackOnDownload, phpRelay] )`

* **query:** string: The query, built by one of the fmxj URL functions
* **callBackOnReady:** function: The handler function for the returned array of objects.
* **callBackOnDownload:** (optional) function: The handler function for the returned array of objects.
* **phpRelay:** (optional) object: specifies the server address and name of the php relay file being used.

The **postQueryFMS** is the primary function used for POSTing query to FileMaker Server via httpXMLRequest and then converting the FMPXMLRESULT xml results into JavaScript objects for callback.  Queries can be created easily from JavaScript objects using the  fmxj URL functions below.  

An optional handler function can be passed as well to report the download progress from FileMaker Server.  Note that FileMaker server does not pass the *e.total* property in it's progres reporting, only the bytes downloded *e.loaded*.

**Deployment and the phpRelay**

