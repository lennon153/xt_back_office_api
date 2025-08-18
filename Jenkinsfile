pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "xt_back_office_app"
        DOCKER_TAG = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('Docker Compose Up') {
            steps {
                sh 'docker-compose down || true' // optional, stop previous containers
                sh 'docker-compose up -d --build'
            }
        }

        stage('Clean Old Docker Images') {
            steps {
                // Remove dangling images
                sh 'docker image prune -f'
                
                // Remove old images of this app except the latest
                sh """ 
                    docker images ${DOCKER_IMAGE} --format "{{.ID}} {{.Tag}}" | \
                    grep -v ${DOCKER_TAG} | \
                    awk '{print \$1}' | \
                    xargs -r docker rmi -f
                """
            }
        }
    }

    post {
        success {
            echo "✅ Deployment finished successfully!"
            sh 'docker ps -a'
        }
        failure {
            echo "❌ Deployment failed!"
            sh 'docker ps -a'
        }
        always {
            echo "📌 Pipeline finished."
        }
    }
}
