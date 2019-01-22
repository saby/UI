node ('controls') {
def version = "19.100"
def workspace = "/home/sbis/workspace/ui_${version}/${BRANCH_NAME}"
    ws (workspace){
        deleteDir()
        checkout([$class: 'GitSCM',
            //branches: [[name: "rc-${version}"]],
            branches: [[name: "19.100/pea/remove_bred"]],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "jenkins_pipeline"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: CREDENTIAL_ID_GIT,
                    url: "${GIT}:sbis-ci/jenkins_pipeline.git"]]
                                    ])
        start = load "./jenkins_pipeline/platforma/branch/JenkinsfileUI"
        start.start(version, BRANCH_NAME, workspace)
    }
}
