(ns tcpoke-server.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.util.response :refer [response]]
            [aleph.http :as http]
            [manifold.stream :as stream]
            [cheshire.core :as json]))

(def chat (stream/stream))

(defn websocket-handler [req]
  (let [ws @(http/websocket-connection req)
        input (stream/map #(json/decode % true) ws)
        messages (stream/filter :text input)
        output (stream/map json/encode chat)]
    (stream/consume println input)
    (stream/connect messages chat {:downstream? false})
    (stream/connect output ws)))

(defroutes app-routes
  (GET "/" [] (response "Hello world"))
  (GET "/websocket" [] websocket-handler)
  (route/not-found (response {:error "Not Found"})))

(def app (wrap-defaults app-routes site-defaults))

(defn -main [port]
  (println "A wild server appeared!")
  (http/start-server app {:port (Integer/parseInt port)}))
