#fmxj.js
##A Javascript approach to FileMaker Custom Web Publishing

With fmxj.js and simple Javascript Objects you can
* Build complex queries and POST them to FileMaker Server
* Return FileMaker parent and child records as JavaScript Objects/JSON
* Create, edit and delete FileMaker records
* Filter and sort Javascript objects locally with complex criteria.

fmxj.js is designed to do most of the data interchange work in JavaScript.  Query strings are created from JavaScript Objects and then POSTED to FileMaker's XML Web Publishing Engine.  An XML FMPXMLRESULT is returned and converted into JavaScript Objects/JSON by a JavaScript function.  POSTS can be done directly to the FileMaker Server's XML WPE or a simple PHP relay can be used to get around cross-domain issues and provide more authentication options.

Working examples and basic function descriptions are available at the <a href="http://www.seedcode.com/fmxj/fmxj.html" target="_blank">fmxj example page</a>.


