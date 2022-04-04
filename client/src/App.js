import React, { useState, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';
import Sharedb from 'sharedb/lib/client';
import richText from 'rich-text';
import axios from 'axios';
import api from './api';
// Registering the rich text type to make sharedb work
// with our quill editor
Sharedb.types.register(richText.type);


function App() {
  const [id, setId] = useState(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    const BaseURL = "http://localhost:4000";
    
    //const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const eventSource = new EventSource(`${BaseURL}/connect/${id}`);
      eventSource.onmessage = (e) => {
        if (e.data.source === quill) return;
        if (e.data) {
          console.log(e.data);
          let content = JSON.parse(e.data).content;
          if (!initialized) {
            console.log("contents set");
            console.log(JSON.parse(e.data).content);
            
            quill.setContents(content.ops);
            setInitialized(true);
          }
          if (!content) {
            let ops = JSON.parse(e.data);
            console.log("ops")
            console.log(ops);
            ops.forEach(element => { // traverse array_of_oplists
              if (e.data.source === quill) {

              } else {
                quill.updateContents(element);
              }
              
            });
          }
         
        }
        
      };
      
      
      const toolbarOptions = ['bold', 'italic', 'underline', 'strike', 'align'];
      const options = {
        theme: 'bubble',
        modules: {
          toolbar: toolbarOptions,
        },
      };
      let quill = new Quill('#editor', options);
      /**
       * On Initialising if data is present in server
       * Updaing its content to editor
       */
      //quill.setContents(doc.data);

      /**
       * On Text change publishing to our server
       * so that it can be broadcasted to all other clients
       */
      quill.on('text-change', function (delta, oldDelta, source) {
        if (source !== 'user') return;
        //doc.submitOp(delta, { source: quill });
        let array_of_oplists = [];
        array_of_oplists[0] = delta.ops;
        let new_array_of_oplists = array_of_oplists;
        let url = `/op/${id}`;
        console.log("changed");
        axios({
          method: 'post',
          url: BaseURL + url,
          headers: {}, 
          data: new_array_of_oplists
        });
        //api.postOp(id,new_array_of_oplists);
        
      });

      /** listening to changes in the document
       * that is coming from our server
       */
      /*doc.on('op', function (op, source) {
        if (source === quill) return;
        quill.updateContents(op);
      });*/
  });

  return (
    <div style={{ margin: '5%', border: '1px solid' }}>
      <div id='editor'></div>
    </div>
  );
}

export default App;