(ns tcpoke-server.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
            [ring.util.response :refer [response]]
            [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
            [taoensso.carmine :as car])
  (:use org.httpkit.server))

(def rconn {:pool {} :spec {:host "127.0.0.1" :port 6379}})

(defn offer [request]
  (println request)
  (with-channel request channel
    (let [uuid (.toString (java.util.UUID/randomUUID))
          body (:body request)
          listener (car/with-new-pubsub-listener (:spec rconn)
                     {uuid (fn [[typ _ body]]
                             (when (= typ "message") (send! channel (response body))))}
                     (car/subscribe uuid))]
    (car/wcar rconn (car/hset "offers" uuid body))
    (on-close channel
      (fn [status]
        (car/wcar rconn (car/hdel "offers" uuid))
        (car/close-listener listener))))))

(defn connect [id body]
  (response
    (peek
      (car/wcar rconn
        (car/publish id body)
        (car/hget "offers" id)))))

(defn list-offers []
  (response
    (car/wcar rconn
      (car/parse-map (car/hgetall "offers")))))

(defroutes app-routes
  (GET "/" [] (response {:my-map "hello"}))
  (GET "/list" [] (list-offers))
  (POST "/offer" [] offer)
  (POST "/connect/:id" {{id :id} :params body :body} (connect id body))
  (route/not-found (response {:error "Not Found"})))

(def app
  (-> app-routes
    wrap-json-body
    wrap-json-response
    (wrap-defaults api-defaults)))

(defn -main [port]
  (println "A wild server appeared!")
  (run-server app {:port (Integer/parseInt port)}))
