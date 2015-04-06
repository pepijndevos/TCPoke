(ns tcpoke-server.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.util.response :refer [response]]
            [aleph.http :as http]
            [manifold.stream :as stream]
            [cheshire.core :as json]))

(def chat (stream/stream))

(defn chat-handler [input]
  (let [messages (stream/filter :text input)]
    (stream/connect messages chat {:downstream? false})
    chat))

(def users (atom {}))

(defn init-user [uuid ws]
  (stream/put! ws (json/encode {:myuuid uuid}))
  (swap! users assoc uuid {:author "???"})
  (stream/put! chat {:users @users}))

(defn user-handler [uuid input ws]
  (stream/consume #(swap! users update-in [uuid] merge %) input)
  (stream/on-closed ws #(swap! users dissoc uuid))
  (stream/periodically 30000 0 (fn [] {:users @users})))

(def session-broadcast (stream/stream))

(defn session-handler [uuid input]
  (let [sessions (stream/filter :to input)
        output (stream/filter #(= (:to %) uuid) session-broadcast)]
    (stream/connect sessions session-broadcast {:downstream? false})
    output))

(defn connect-json [in out]
  (let [output (stream/map json/encode in)]
    (stream/connect output out)))

(defn websocket-handler [req]
  (let [uuid (.toString (java.util.UUID/randomUUID))
        ws @(http/websocket-connection req)
        input (stream/map #(json/decode % true) ws)]
    (stream/consume println input)
    (init-user uuid ws)
    (connect-json (user-handler uuid input ws) ws)
    (connect-json (chat-handler input) ws)
    (connect-json (session-handler uuid input) ws)))

(defroutes app-routes
  (GET "/" [] (response "Hello world"))
  (GET "/websocket" [] websocket-handler)
  (route/not-found (response {:error "Not Found"})))

(def app (wrap-defaults app-routes site-defaults))

(defn -main [port]
  (println "A wild server appeared!")
  (http/start-server #'app {:port (Integer/parseInt port)}))
