FROM confluentinc/cp-kafka-connect:7.3.2

#If you want to run a local build of the connector, uncomment the COPY command and make sure the JAR file is in the directory path
#COPY mongo-kafka-connect-<<INSERT BUILD HERE>>3-all.jar /usr/share/confluent-hub-components

RUN confluent-hub install --no-prompt mongodb/kafka-connect-mongodb:1.8.0

ENV CONNECT_PLUGIN_PATH="/usr/share/java,/usr/share/confluent-hub-components"