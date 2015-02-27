(defproject tcpoke_server "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :min-lein-version "2.0.0"
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [compojure "1.3.1"]
                 [ring/ring-defaults "0.1.2"]
                 [aleph "0.4.0-beta3"]
                 [cheshire "5.4.0"]]
  :main tcpoke-server.handler)
