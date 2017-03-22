HopplerJS
=========

Work In Progress
----------------
This work is still under heavy development and should not yet be used.

Usage
-----

The easiest way to use HopperJS is to add this fragment the main template of your single-page application.

    <script type="text/javascript">
      var _hplr = {
          autostart: true,
          siteName: 'MyWebApp',
          server: 'https://hoppler-api-server',
          usernameHeader: 'AUTH_USER_HEADER',
      };
    
      (function() {
        var u=_hplr.server;
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.src=u+'/getjs'; s.parentNode.insertBefore(g,s);
      }
      )();
    
    </script>
    
    
    


